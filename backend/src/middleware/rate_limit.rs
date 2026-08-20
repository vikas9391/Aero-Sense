use crate::errors::AppError;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

/// Simple in-memory fixed-window limiter for `POST /api/auth/login`.
///
/// Login is the one endpoint that's reachable by definition without a valid
/// token, which makes it the obvious brute-force target — Argon2 makes each
/// guess slow, but nothing previously stopped an attacker from firing
/// thousands of requests at it. This throttles by `ip:email` (not just IP),
/// so one attacker hammering many different accounts from one IP is limited
/// per-account, and one account being targeted from many IPs is still
/// limited overall once combined with the email component.
///
/// Deliberately simple: no external crate, just a `Mutex<HashMap<..>>`. Good
/// enough for a single-instance deployment. A multi-instance deployment
/// behind a load balancer would need a shared store (e.g. Redis) instead,
/// since each instance would otherwise track its own separate counts.
#[derive(Clone)]
pub struct LoginRateLimiter {
    inner: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    max_attempts: usize,
    window: Duration,
}

impl LoginRateLimiter {
    pub fn new(max_attempts: usize, window: Duration) -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
            max_attempts,
            window,
        }
    }

    /// Call before attempting a login. Returns `429` if this key has already
    /// hit the attempt ceiling within the current window. Does not itself
    /// record an attempt — call `record_failure`/`record_success` after the
    /// login attempt resolves.
    pub fn check(&self, key: &str) -> Result<(), AppError> {
        let mut map = self.inner.lock().unwrap();
        let now = Instant::now();
        let attempts = map.entry(key.to_string()).or_default();
        attempts.retain(|t| now.duration_since(*t) < self.window);

        if attempts.len() >= self.max_attempts {
            return Err(AppError::TooManyRequests(
                "Too many login attempts. Please wait a few minutes and try again.".to_string(),
            ));
        }
        Ok(())
    }

    /// Record a failed login attempt against this key.
    pub fn record_failure(&self, key: &str) {
        let mut map = self.inner.lock().unwrap();
        let now = Instant::now();
        let attempts = map.entry(key.to_string()).or_default();
        attempts.retain(|t| now.duration_since(*t) < self.window);
        attempts.push(now);
    }

    /// Clear attempts for this key after a successful login.
    pub fn record_success(&self, key: &str) {
        let mut map = self.inner.lock().unwrap();
        map.remove(key);
    }

    /// Drop keys with no attempts left inside the current window, so the map
    /// doesn't grow unbounded under sustained traffic. Intended to be called
    /// periodically from a background task (see `spawn_cleanup_task`).
    fn evict_stale(&self) {
        let mut map = self.inner.lock().unwrap();
        let now = Instant::now();
        let window = self.window;
        map.retain(|_, attempts| {
            attempts.retain(|t| now.duration_since(*t) < window);
            !attempts.is_empty()
        });
    }
}

/// Spawns a background task that periodically evicts stale rate-limit
/// entries for the lifetime of the process. Call once at startup.
pub fn spawn_cleanup_task(limiter: LoginRateLimiter) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(300));
        loop {
            interval.tick().await;
            limiter.evict_stale();
        }
    });
}
