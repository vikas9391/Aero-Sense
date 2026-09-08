import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const defaultApiBase = 'https://aero-sense-backend-0y3l.onrender.com/api';
const tokenKey = 'aero_sense_token';

class Api {
  Api({String? baseUrl}) {
    final configured = baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: defaultApiBase);
    final normalized = configured.endsWith('/') ? configured.substring(0, configured.length - 1) : configured;
    dio = Dio(BaseOptions(baseUrl: normalized, connectTimeout: const Duration(seconds: 45), receiveTimeout: const Duration(seconds: 45), sendTimeout: const Duration(seconds: 30), headers: const {'Content-Type': 'application/json'}, validateStatus: (status) => status != null && status < 500));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: tokenKey);
        if (token != null && token.isNotEmpty) options.headers['Authorization'] = 'Bearer $token';
        if (kDebugMode) debugPrint('[Aero-Sense] ${options.method} ${options.uri}');
        handler.next(options);
      },
      onResponse: (response, handler) {
        if (kDebugMode) debugPrint('[Aero-Sense] ${response.statusCode} ${response.requestOptions.uri}');
        if (response.statusCode != null && response.statusCode! >= 400) {
          handler.reject(DioException.badResponse(statusCode: response.statusCode!, requestOptions: response.requestOptions, response: response));
          return;
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (kDebugMode) debugPrint('[Aero-Sense] ERROR ${error.type} ${error.response?.statusCode ?? ''} ${error.requestOptions.uri}');
        if (error.response?.statusCode == 401) {
          await storage.delete(key: tokenKey);
          await clearCache();
        }
        handler.next(error);
      },
    ));
  }

  late final Dio dio;
  final storage = const FlutterSecureStorage();
  static const cacheTtl = Duration(minutes: 2);

  Future<bool> isBackendReachable() async {
    try {
      return (await dio.get('/health')).statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> login(String company, String email, String password) async {
    final result = Map<String, dynamic>.from((await dio.post('/auth/login', data: {'company_name': company, 'email': email, 'password': password})).data as Map);
    await clearCache();
    return result;
  }

  Future<User> me() async => User.fromJson(Map<String, dynamic>.from(await _cachedGet('me', () => dio.get('/auth/me'))));
  Future<User> changePassword(String currentPassword, String newPassword) async {
    final result = User.fromJson(Map<String, dynamic>.from((await dio.put('/auth/change-password', data: {'current_password': currentPassword, 'new_password': newPassword})).data));
    await _deleteCache('me');
    return result;
  }

  Future<Analytics> analytics() async => Analytics.fromJson(Map<String, dynamic>.from(await _cachedGet('analytics_overview', () => dio.get('/analytics/overview'))));
  Future<List<User>> users() async => _list(await _cachedGet('users', () => dio.get('/users'))).map(User.fromJson).toList();
  Future<User> createUser(String name, String email, String password, String role) async {
    final result = User.fromJson(Map<String, dynamic>.from((await dio.post('/users', data: {'name': name, 'email': email, 'password': password, 'role': role})).data));
    await _deleteCache('users');
    return result;
  }
  Future<List<Aircraft>> aircraft() async => _list(await _cachedGet('aircraft', () => dio.get('/aircraft'))).map(Aircraft.fromJson).toList();
  Future<Aircraft> createAircraft(Map<String, dynamic> data) async {
    final result = Aircraft.fromJson(Map<String, dynamic>.from((await dio.post('/aircraft', data: data)).data));
    await _deleteCache('aircraft');
    await _deleteCache('analytics_overview');
    return result;
  }
  Future<List<Component>> components() async => _list(await _cachedGet('components', () => dio.get('/components'))).map(Component.fromJson).toList();
  Future<Component> component(int id) async => Component.fromJson(Map<String, dynamic>.from(await _cachedGet('component_$id', () => dio.get('/components/$id'))));
  Future<Component> createComponent(Map<String, dynamic> data) async {
    final result = Component.fromJson(Map<String, dynamic>.from((await dio.post('/components', data: data)).data));
    await _deleteCache('components');
    await _deleteCache('analytics_overview');
    return result;
  }
  Future<Component> updateComponent(int id, Map<String, dynamic> data) async {
    final result = Component.fromJson(Map<String, dynamic>.from((await dio.put('/components/$id', data: data)).data));
    await _deleteCache('components');
    await _deleteCache('component_$id');
    await _deleteCache('component_history_$id');
    await _deleteCache('analytics_overview');
    return result;
  }
  Future<List<ComponentUpdateHistory>> componentUpdateHistory(int id) async => _list(await _cachedGet('component_history_$id', () => dio.get('/components/$id/update-history'))).map(ComponentUpdateHistory.fromJson).toList();
  Future<List<MaintenanceRecord>> maintenance() async => _list(await _cachedGet('maintenance', () => dio.get('/maintenance'))).map(MaintenanceRecord.fromJson).toList();
  Future<MaintenanceRecord> createMaintenance(Map<String, dynamic> data) async {
    final result = MaintenanceRecord.fromJson(Map<String, dynamic>.from((await dio.post('/maintenance', data: data)).data));
    await _deleteCache('maintenance');
    await _deleteCache('analytics_overview');
    return result;
  }
  Future<List<VerificationLog>> verificationLogs() async => _list(await _cachedGet('verification_logs', () => dio.get('/verification/logs'))).map(VerificationLog.fromJson).toList();
  Future<List<VerificationLog>> componentVerifications(int id) async => _list(await _cachedGet('component_verifications_$id', () => dio.get('/components/$id/verification'))).map(VerificationLog.fromJson).toList();
  Future<VerificationResponse> verifyNfc(String tag, {String? payload}) async {
    final result = VerificationResponse.fromJson(Map<String, dynamic>.from((await dio.post('/verification/nfc', data: {'tag_identifier': tag, if (payload != null && payload.isNotEmpty) 'payload': payload})).data));
    await _deleteCache('verification_logs');
    await _deleteCache('analytics_overview');
    return result;
  }
  Future<Map<String, dynamic>> verifyBlockchain(int recordId) async => Map<String, dynamic>.from((await dio.post('/blockchain/verify', data: {'record_id': recordId})).data);
  Future<List<CompanySummary>> companies() async => _list(await _cachedGet('companies', () => dio.get('/companies'))).map(CompanySummary.fromJson).toList();
  Future<CompanySummary> company(int id) async => CompanySummary.fromJson(Map<String, dynamic>.from(await _cachedGet('company_$id', () => dio.get('/companies/$id'))));
  Future<List<User>> companyUsers(int id) async => _list(await _cachedGet('company_users_$id', () => dio.get('/companies/$id/users'))).map(User.fromJson).toList();
  Future<Company> createCompany(String name, {String? slug}) async => Company.fromJson(Map<String, dynamic>.from((await dio.post('/companies', data: {'name': name, if (slug != null && slug.isNotEmpty) 'slug': slug})).data));
  Future<User> createCompanyAdmin(int companyId, String name, String email, String password) async => User.fromJson(Map<String, dynamic>.from((await dio.post('/companies/$companyId/admins', data: {'name': name, 'email': email, 'password': password})).data));
  Future<Company> updateCompanyStatus(int id, String status) async => Company.fromJson(Map<String, dynamic>.from((await dio.put('/companies/$id/status', data: {'status': status})).data));

  Future<dynamic> _cachedGet(String key, Future<Response<dynamic>> Function() request) async {
    final cacheKey = 'cache_$key';
    try {
      final raw = await storage.read(key: cacheKey);
      if (raw != null && raw.isNotEmpty) {
        final envelope = jsonDecode(raw);
        if (envelope is Map && envelope['timestamp'] is int && envelope['data'] != null) {
          final age = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(envelope['timestamp'] as int));
          if (age <= cacheTtl) return envelope['data'];
        }
      }
    } catch (_) {}

    try {
      final response = await request();
      await storage.write(key: cacheKey, value: jsonEncode({'timestamp': DateTime.now().millisecondsSinceEpoch, 'data': response.data}));
      return response.data;
    } catch (e) {
      try {
        final raw = await storage.read(key: cacheKey);
        if (raw != null && raw.isNotEmpty) return (jsonDecode(raw) as Map)['data'];
      } catch (_) {}
      rethrow;
    }
  }

  Future<void> _deleteCache(String key) async {
    try {
      await storage.delete(key: 'cache_$key');
    } catch (_) {}
  }

  Future<void> clearCache() async {
    try {
      final values = await storage.readAll();
      for (final key in values.keys.where((key) => key.startsWith('cache_'))) {
        await storage.delete(key: key);
      }
    } catch (_) {}
  }

  String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'] ?? data['detail'];
        if (message is String && message.trim().isNotEmpty) return message;
        final nested = data['error'];
        if (nested is Map && nested['message'] is String) return nested['message'];
      }
      if (error.type == DioExceptionType.connectionTimeout || error.type == DioExceptionType.receiveTimeout || error.type == DioExceptionType.sendTimeout) return 'The server took too long to respond.';
      if (error.type == DioExceptionType.connectionError) return 'Cannot reach Aero-Sense backend. Check the API address and network.';
      if (error.response?.statusCode == 401) return 'Your session has expired. Please sign in again.';
      if (error.response?.statusCode == 403) return 'Your account is not authorized for this operation.';
      if (error.response?.statusCode == 404) return 'The requested resource was not found.';
      if (error.response?.statusCode != null) return 'Server error (${error.response!.statusCode}). Please try again.';
    }
    return error.toString().replaceFirst('Exception: ', '');
  }

  List<Map<String, dynamic>> _list(dynamic data) {
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    return [];
  }
}
