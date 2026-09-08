import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/api.dart';
import 'dashboard_page.dart';
import 'management_pages.dart' hide api;
import 'nfc_pages.dart' hide nfcApi;
import 'registration_pages.dart' hide api;
import 'screens.dart' hide api;
import 'security_audit.dart';
import 'super_admin.dart' hide api;
import 'tag_onboarding_page.dart' hide onboardingApi;
import 'theme.dart';
import 'widgets.dart';

final routerApi = Api();

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const _RouteGate()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShellFrame(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (context, state) => const _DashboardRoute()),
        GoRoute(path: '/verify', builder: (context, state) => const NfcVerificationScreen()),
        GoRoute(path: '/nfc-center', builder: (context, state) => const NfcCenterScreen()),
        GoRoute(path: '/aircraft', builder: (context, state) => const AircraftScreen()),
        GoRoute(path: '/components', builder: (context, state) => const ComponentsScreen()),
        GoRoute(path: '/maintenance', builder: (context, state) => const MaintenanceScreen()),
        GoRoute(path: '/users', builder: (context, state) => const UsersScreen()),
        GoRoute(path: '/analytics', builder: (context, state) => const AnalyticsScreen()),
        GoRoute(path: '/security', builder: (context, state) => const SecurityAuditScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen()),
        GoRoute(path: '/companies', builder: (context, state) => const CompanyManagementScreen()),
        GoRoute(
          path: '/register-component',
          builder: (context, state) {
            final uid = state.uri.queryParameters['uid'];
            return uid != null && uid.trim().isNotEmpty
                ? TagOnboardingScreen(uid: uid.trim().toUpperCase())
                : const RegisterComponentScreen();
          },
        ),
        GoRoute(path: '/register-tag', builder: (context, state) => const RegisterTagScreen()),
        GoRoute(
          path: '/passport',
          builder: (context, state) {
            final component = state.extra;
            return component is Component ? PassportScreen(component: component) : const ComponentsScreen();
          },
        ),
        GoRoute(
          path: '/company-detail',
          builder: (context, state) {
            final company = state.extra;
            return company is CompanySummary ? CompanyDetailScreen(company: company) : const CompanyManagementScreen();
          },
        ),
      ],
    ),
  ],
  redirect: (context, state) async {
    final token = await routerApi.storage.read(key: tokenKey);
    final authenticated = token != null && token.isNotEmpty;
    final location = state.uri.path;

    if (!authenticated && location != '/login') return '/login';
    if (authenticated && (location == '/' || location == '/login')) return '/dashboard';
    return null;
  },
);

class _RouteGate extends StatelessWidget {
  const _RouteGate();

  @override
  Widget build(BuildContext context) => const _SplashScreen();
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.flight_takeoff_rounded, size: 48, color: accent),
              SizedBox(height: 14),
              Text('AERO-SENSE', style: TextStyle(fontSize: 21, fontWeight: FontWeight.w900, letterSpacing: 2)),
              SizedBox(height: 5),
              Text('COMPONENT INTELLIGENCE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: muted, letterSpacing: 1.6)),
              SizedBox(height: 22),
              SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: accent)),
            ],
          ),
        ),
      );
}

class _DashboardRoute extends StatelessWidget {
  const _DashboardRoute();

  @override
  Widget build(BuildContext context) => MobileDashboardScreen(role: AppShellFrame.currentRole(context));
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
  bool get canRegister => isCompanyAdmin || role == 'MANUFACTURER';

  @override
  void initState() {
    super.initState();
    routerApi.me().then((value) {
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
    final result = <_RouteNavItem>[const _RouteNavItem('Dashboard', '/dashboard', Icons.dashboard_outlined)];
    if (canVerify) result.add(const _RouteNavItem('Verify', '/verify', Icons.verified_user_outlined));
    result.add(const _RouteNavItem('Components', '/components', Icons.memory_outlined));
    result.add(const _RouteNavItem('Profile', '/profile', Icons.person_outline));
    return result;
  }

  List<_RouteNavItem> get drawerItems {
    if (isSuperAdmin) return items;
    final result = <_RouteNavItem>[...items, const _RouteNavItem('Aircraft', '/aircraft', Icons.flight_outlined)];
    if (canVerify) result.add(const _RouteNavItem('NFC Center', '/nfc-center', Icons.nfc_outlined));
    if (canMaintain) result.add(const _RouteNavItem('Maintenance', '/maintenance', Icons.build_outlined));
    if (isCompanyAdmin) {
      result.addAll(const [
        _RouteNavItem('Users', '/users', Icons.people_outline),
        _RouteNavItem('Analytics', '/analytics', Icons.analytics_outlined),
      ]);
    }
    if (canAudit) result.add(const _RouteNavItem('Security & Audit', '/security', Icons.security_outlined));
    if (canRegister) {
      result.addAll(const [
        _RouteNavItem('Register Component', '/register-component', Icons.add_box_outlined),
        _RouteNavItem('Register NFC Tag', '/register-tag', Icons.nfc_outlined),
      ]);
    }
    return result;
  }

  _RouteNavItem? get currentItem {
    final path = GoRouterState.of(context).uri.path;
    for (final item in drawerItems) {
      if (path == item.route) return item;
    }
    if (path == '/passport') return const _RouteNavItem('Component Passport', '/passport', Icons.badge_outlined);
    if (path == '/company-detail') return const _RouteNavItem('Company Details', '/company-detail', Icons.business_outlined);
    return null;
  }

  void go(String route, {Object? extra}) {
    final allowed = drawerItems.any((item) => item.route == route) ||
        route == '/dashboard' ||
        route == '/passport' ||
        (isSuperAdmin && route == '/company-detail');
    if (allowed) {
      context.go(route, extra: extra);
    } else {
      context.go('/dashboard');
    }
  }

  Future<void> signOut() async {
    await routerApi.storage.delete(key: tokenKey);
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final primary = items;
    final drawer = drawerItems;
    final current = currentItem;
    final rawIndex = current == null ? 0 : primary.indexWhere((item) => item.route == current.route);
    final selectedIndex = rawIndex < 0 ? 0 : rawIndex;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        title: Text(current?.label ?? 'Aero-Sense', style: const TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          if (canVerify) IconButton(onPressed: () => go('/verify'), icon: const Icon(Icons.nfc), tooltip: 'Verify NFC tag'),
          IconButton(onPressed: () => go('/profile'), icon: const Icon(Icons.account_circle_outlined), tooltip: 'Profile'),
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
                        Text(user!.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 3),
                        Text(user!.role, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: muted, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  itemCount: drawer.length,
                  itemBuilder: (_, i) => ListTile(
                    selected: drawer[i].route == current?.route,
                    leading: Icon(drawer[i].icon),
                    title: Text(drawer[i].label, overflow: TextOverflow.ellipsis),
                    onTap: () {
                      Navigator.pop(context);
                      go(drawer[i].route);
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
        selectedIndex: selectedIndex,
        onDestinationSelected: (index) => go(primary[index].route),
        destinations: [
          for (final item in primary) NavigationDestination(icon: Icon(item.icon), label: item.label),
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
