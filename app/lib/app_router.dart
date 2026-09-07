import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api.dart';
import 'dashboard_page.dart';
import 'management_pages.dart';
import 'nfc_pages.dart';
import 'registration_pages.dart';
import 'screens.dart';
import 'security_audit.dart';
import 'super_admin.dart';
import 'theme.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const _RouteGate()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShellFrame(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (context, state) => MobileDashboardScreen(role: AppShellFrame.currentRole(context))),
        GoRoute(path: '/verify', builder: (context, state) => const NfcVerificationScreen()),
        GoRoute(path: '/aircraft', builder: (context, state) => const AircraftScreen()),
        GoRoute(path: '/components', builder: (context, state) => const ComponentsScreen()),
        GoRoute(path: '/maintenance', builder: (context, state) => const MaintenanceScreen()),
        GoRoute(path: '/users', builder: (context, state) => const UsersScreen()),
        GoRoute(path: '/analytics', builder: (context, state) => const AnalyticsScreen()),
        GoRoute(path: '/security', builder: (context, state) => const SecurityAuditScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
        GoRoute(path: '/companies', builder: (context, state) => const CompanyManagementScreen()),
        GoRoute(path: '/nfc-center', builder: (context, state) => const NfcCenterScreen()),
        GoRoute(path: '/register-component', builder: (context, state) => const RegisterComponentScreen()),
        GoRoute(path: '/register-tag', builder: (context, state) => const RegisterTagScreen()),
        GoRoute(
          path: '/passport',
          builder: (context, state) {
            final component = state.extra;
            if (component is! Component) {
              return const ComponentsScreen();
            }
            return PassportScreen(component: component);
          },
        ),
        GoRoute(
          path: '/company-detail',
          builder: (context, state) {
            final company = state.extra;
            if (company is! CompanySummary) {
              return const CompanyManagementScreen();
            }
            return CompanyDetailScreen(company: company);
          },
        ),
      ],
    ),
  ],
  redirect: (context, state) async {
    final token = await api.storage.read(key: tokenKey);
    final authenticated = token != null && token.isNotEmpty;
    final location = state.uri.path;

    if (!authenticated && location != '/login') {
      return '/login';
    }
    if (authenticated && (location == '/' || location == '/login')) {
      return '/dashboard';
    }
    return null;
  },
);

class _RouteGate extends StatelessWidget {
  const _RouteGate();

  @override
  Widget build(BuildContext context) => const SplashScreen();
}

class AppShellFrame extends StatefulWidget {
  final Widget child;

  const AppShellFrame({required this.child, super.key});

  static String currentRole(BuildContext context) {
    final state = context.findAncestorStateOfType<_AppShellFrameState>();
    return state?.role ?? '';
  }

  @override
  State<AppShellFrame> createState() => _AppShellFrameState();
}

class _AppShellFrameState extends State<AppShellFrame> {
  User? user;

  String get role => (user?.role ?? '').toUpperCase();
  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isCompanyAdmin => role == 'COMPANY_ADMIN';
  bool get canVerify => isCompanyAdmin || role == 'MANUFACTURER' || role == 'MAINTENANCE_TECHNICIAN' || role == 'INSPECTOR';
  bool get canAudit => isCompanyAdmin || role == 'INSPECTOR';
  bool get canMaintain => isCompanyAdmin || role == 'MAINTENANCE_TECHNICIAN';

  @override
  void initState() {
    super.initState();
    api.me().then((value) {
      if (mounted) setState(() => user = value);
    }).catchError((_) {
      if (mounted) context.go('/login');
    });
  }

  List<_RouteNavItem> get items {
    if (isSuperAdmin) {
      return const [
        _RouteNavItem('Companies', '/companies', Icons.business_outlined),
        _RouteNavItem('Profile', '/profile', Icons.person_outline),
      ];
    }

    final result = <_RouteNavItem>[
      const _RouteNavItem('Dashboard', '/dashboard', Icons.dashboard_outlined),
    ];
    if (canVerify) result.add(const _RouteNavItem('Verify', '/verify', Icons.verified_user_outlined));
    result.addAll(const [
      _RouteNavItem('Aircraft', '/aircraft', Icons.flight_outlined),
      _RouteNavItem('Components', '/components', Icons.memory_outlined),
    ]);
    if (canMaintain) result.add(const _RouteNavItem('Maintenance', '/maintenance', Icons.build_outlined));
    if (isCompanyAdmin) {
      result.addAll(const [
        _RouteNavItem('Users', '/users', Icons.people_outline),
        _RouteNavItem('Analytics', '/analytics', Icons.analytics_outlined),
      ]);
    }
    if (canAudit) result.add(const _RouteNavItem('Security & Audit', '/security', Icons.security_outlined));
    result.add(const _RouteNavItem('Profile', '/profile', Icons.person_outline));
    return result;
  }

  _RouteNavItem? get currentItem {
    final path = GoRouterState.of(context).uri.path;
    for (final item in items) {
      if (path == item.route) return item;
    }
    return null;
  }

  void go(String route) {
    if (items.any((item) => item.route == route)) {
      context.go(route);
    } else {
      context.go('/dashboard');
    }
  }

  Future<void> signOut() async {
    await api.storage.delete(key: tokenKey);
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final navItems = items;
    final current = currentItem;
    final selectedIndex = current == null ? 0 : navItems.indexOf(current);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        title: Text(current?.label ?? 'Aero-Sense', style: const TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          if (canVerify)
            IconButton(
              onPressed: () => go('/verify'),
              icon: const Icon(Icons.nfc),
              tooltip: 'Verify NFC tag',
            ),
          IconButton(
            onPressed: () => go('/profile'),
            icon: const Icon(Icons.account_circle_outlined),
            tooltip: 'Profile',
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 14),
                child: Row(
                  children: [
                    const Icon(Icons.flight_takeoff_rounded, color: accent, size: 30),
                    const SizedBox(width: 10),
                    const Expanded(child: Text('AERO-SENSE', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.2))),
                  ],
                ),
              ),
              if (user != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user!.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 3),
                        Text(user!.role, style: const TextStyle(color: muted, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  itemCount: navItems.length,
                  itemBuilder: (_, i) => ListTile(
                    selected: i == selectedIndex,
                    leading: Icon(navItems[i].icon),
                    title: Text(navItems[i].label),
                    onTap: () {
                      Navigator.pop(context);
                      go(navItems[i].route);
                    },
                  ),
                ),
              ),
              const Divider(height: 1),
              ListTile(leading: const Icon(Icons.logout), title: const Text('Sign out'), onTap: signOut),
            ],
          ),
        ),
      ),
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex.clamp(0, navItems.length - 1),
        onDestinationSelected: (index) => go(navItems[index].route),
        destinations: [
          for (final item in navItems)
            NavigationDestination(icon: Icon(item.icon), label: item.label),
        ],
      ),
    );
  }
}

class _RouteNavItem {
  final String label;
  final String route;
  final IconData icon;

  const _RouteNavItem(this.label, this.route, this.icon);
}
