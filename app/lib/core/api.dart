import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const defaultApiBase = 'http://10.0.2.2:8080/api';
const tokenKey = 'aero_sense_token';

class Api {
  Api({String? baseUrl}) {
    final configured = baseUrl ?? const String.fromEnvironment('API_BASE_URL', defaultValue: defaultApiBase);
    final normalized = configured.endsWith('/') ? configured.substring(0, configured.length - 1) : configured;
    dio = Dio(BaseOptions(
      baseUrl: normalized,
      connectTimeout: const Duration(seconds: 12),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 12),
      headers: const {'Content-Type': 'application/json'},
      validateStatus: (status) => status != null && status < 500,
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: tokenKey);
        if (token != null && token.isNotEmpty) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onResponse: (response, handler) {
        if (response.statusCode != null && response.statusCode! >= 400) {
          handler.reject(DioException.badResponse(statusCode: response.statusCode!, requestOptions: response.requestOptions, response: response));
          return;
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) await storage.delete(key: tokenKey);
        handler.next(error);
      },
    ));
  }

  late final Dio dio;
  final storage = const FlutterSecureStorage();

  Future<bool> isBackendReachable() async {
    try {
      final response = await dio.get('/health');
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> login(String company, String email, String password) async => Map<String, dynamic>.from((await dio.post('/auth/login', data: {'company_name': company, 'email': email, 'password': password})).data as Map);
  Future<User> me() async => User.fromJson(Map<String, dynamic>.from((await dio.get('/auth/me')).data));
  Future<Analytics> analytics() async => Analytics.fromJson(Map<String, dynamic>.from((await dio.get('/analytics/overview')).data));
  Future<List<Aircraft>> aircraft() async => _list((await dio.get('/aircraft')).data).map(Aircraft.fromJson).toList();
  Future<List<Component>> components() async => _list((await dio.get('/components')).data).map(Component.fromJson).toList();
  Future<Component> component(int id) async => Component.fromJson(Map<String, dynamic>.from((await dio.get('/components/$id')).data));
  Future<List<MaintenanceRecord>> maintenance() async => _list((await dio.get('/maintenance')).data).map(MaintenanceRecord.fromJson).toList();
  Future<MaintenanceRecord> createMaintenance(Map<String, dynamic> data) async => MaintenanceRecord.fromJson(Map<String, dynamic>.from((await dio.post('/maintenance', data: data)).data));
  Future<List<VerificationLog>> verificationLogs() async => _list((await dio.get('/verification/logs')).data).map(VerificationLog.fromJson).toList();
  Future<List<VerificationLog>> componentVerifications(int id) async => _list((await dio.get('/components/$id/verification')).data).map(VerificationLog.fromJson).toList();
  Future<VerificationResponse> verifyNfc(String tag, {String? payload}) async => VerificationResponse.fromJson(Map<String, dynamic>.from((await dio.post('/verification/nfc', data: {'tag_identifier': tag, if (payload != null && payload.isNotEmpty) 'payload': payload})).data));
  Future<Map<String, dynamic>> verifyBlockchain(int recordId) async => Map<String, dynamic>.from((await dio.post('/blockchain/verify', data: {'record_id': recordId})).data);

  String errorMessage(Object error) {
    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'] ?? data['detail'];
        if (message is String && message.trim().isNotEmpty) return message;
      }
      if (error.type == DioExceptionType.connectionTimeout || error.type == DioExceptionType.receiveTimeout || error.type == DioExceptionType.sendTimeout) return 'The server took too long to respond.';
      if (error.type == DioExceptionType.connectionError) return 'Cannot reach Aero-Sense backend. Check the API address and network.';
      if (error.response?.statusCode == 401) return 'Your session has expired. Please sign in again.';
      if (error.response?.statusCode == 403) return 'You do not have permission for this action.';
      if (error.response?.statusCode == 404) return 'The requested resource was not found.';
      if (error.response?.statusCode != null) return 'Server error (${error.response!.statusCode}). Please try again.';
    }
    return error.toString().replaceFirst('Exception: ', '');
  }

  List<Map<String, dynamic>> _list(dynamic data) {
    if (data is List) return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    if (data is Map && data['data'] is List) return (data['data'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
    return [];
  }
}

class User { final int id; final String name, email, role; final int? companyId; User({required this.id, required this.name, required this.email, required this.role, this.companyId}); factory User.fromJson(Map<String,dynamic> j)=>User(id:j['id']??0,name:j['name']??'',email:j['email']??'',role:j['role']??'VIEWER',companyId:j['company_id']); }
class Analytics { final int users, aircraft, components, maintenance, verifications, passed, failed; Analytics({required this.users,required this.aircraft,required this.components,required this.maintenance,required this.verifications,required this.passed,required this.failed}); factory Analytics.fromJson(Map<String,dynamic> j)=>Analytics(users:j['total_users']??0,aircraft:j['total_aircraft']??0,components:j['total_components']??0,maintenance:j['total_maintenance_records']??0,verifications:j['total_verifications']??0,passed:j['verifications_passed']??0,failed:j['verifications_failed']??0); }
class Aircraft { final int id; final String registration, model, manufacturer, status; Aircraft({required this.id,required this.registration,required this.model,required this.manufacturer,required this.status}); factory Aircraft.fromJson(Map<String,dynamic> j)=>Aircraft(id:j['id']??0,registration:j['registration_number']??'',model:j['model']??'',manufacturer:j['manufacturer']??'',status:j['status']??''); }
class Component { final int id; final String uuid, serial, type, manufacturer, status; final int? aircraftId; final String? aircraftRegistration; Component({required this.id,required this.uuid,required this.serial,required this.type,required this.manufacturer,required this.status,this.aircraftId,this.aircraftRegistration}); factory Component.fromJson(Map<String,dynamic> j)=>Component(id:j['id']??0,uuid:j['component_uuid']??'',serial:j['serial_number']??'',type:j['component_type']??'',manufacturer:j['manufacturer']??'',status:j['status']??'',aircraftId:j['aircraft_id'],aircraftRegistration:j['aircraft_registration']); }
class MaintenanceRecord { final int id, componentId; final String technician, type, description, result, hash, createdAt; final String? parts; MaintenanceRecord({required this.id,required this.componentId,required this.technician,required this.type,required this.description,required this.result,required this.hash,required this.createdAt,this.parts}); factory MaintenanceRecord.fromJson(Map<String,dynamic> j)=>MaintenanceRecord(id:j['id']??0,componentId:j['component_id']??0,technician:j['technician_name']??'',type:j['maintenance_type']??'',description:j['description']??'',result:j['inspection_result']??'',hash:j['record_hash']??'',createdAt:j['created_at']??'',parts:j['parts_replaced']); }
class VerificationLog { final int id; final String status, createdAt, reason; VerificationLog({required this.id,required this.status,required this.createdAt,required this.reason}); factory VerificationLog.fromJson(Map<String,dynamic> j)=>VerificationLog(id:j['id']??0,status:j['status']??j['final_result']??'',createdAt:j['created_at']??'',reason:j['failure_reason']??''); }
class VerificationResponse { final bool verified; final String status; final Map<String,bool> checks; final String? reason; final Map<String,dynamic>? component; VerificationResponse({required this.verified,required this.status,required this.checks,this.reason,this.component}); factory VerificationResponse.fromJson(Map<String,dynamic> j)=>VerificationResponse(verified:j['verified']==true,status:j['status']??'INVALID',checks:Map<String,bool>.from((j['checks']??{}).map((k,v)=>MapEntry(k.toString(),v==true))),reason:j['failure_reason'],component:j['component'] is Map?Map<String,dynamic>.from(j['component']):null); }
