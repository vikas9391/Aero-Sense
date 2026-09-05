import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import * as SecureStore from "expo-secure-store";
import {
  Boxes,
  ChevronRight,
  Home as HomeIcon,
  LogOut,
  Plane,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Wrench,
} from "lucide-react-native";
import {
  analyticsApi,
  aircraftApi,
  authApi,
  componentsApi,
  maintenanceApi,
  verificationApi,
} from "./src/api";
import type {
  Analytics,
  Aircraft,
  Component,
  MaintenanceRecord,
  User,
  VerificationResponse,
} from "./src/types";

const C = {
  bg: "#071018",
  panel: "#0d1a24",
  panel2: "#122331",
  text: "#f4f8fb",
  muted: "#8ea3b3",
  accent: "#6ee7ff",
  good: "#48e39a",
  warn: "#ffc857",
  bad: "#ff6b6b",
  line: "#1c3445",
};

const TOKEN_KEY = "aero_sense_token";

type Screen = "home" | "components" | "aircraft" | "scan" | "passport" | "maintenanceLog";

type VerificationLog = {
  id: number;
  final_result?: string;
  failure_reason?: string | null;
  created_at: string;
  authentication_result?: boolean;
  component_binding_result?: boolean;
  tamper_result?: boolean;
  blockchain_result?: boolean;
};

function Button({ title, onPress, disabled = false, icon }: any) {
  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, disabled && { opacity: 0.5 }]}>
      {icon}
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function Card({ children }: any) {
  return <View style={styles.card}>{children}</View>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [boot, setBoot] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [selected, setSelected] = useState<Component | null>(null);
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const navItems = [
    ["home", "Home", HomeIcon],
    ["components", "Parts", Boxes],
    ["aircraft", "Fleet", Plane],
    ["scan", "Verify", ScanLine],
  ] as const;

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) setUser(await authApi.me());
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setBoot(false);
      }
    })();
  }, []);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [a, c, ac] = await Promise.all([
        analyticsApi.overview().catch(() => null),
        componentsApi.list(),
        aircraftApi.list(),
      ]);
      setAnalytics(a);
      setComponents(c);
      setAircraft(ac);
    } catch (e: any) {
      Alert.alert("Sync failed", e?.response?.data?.message ?? "Could not reach the Aero-Sense backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  const openComponent = async (component: Component) => {
    setSelected(component);
    try {
      const [maintenance, verifications] = await Promise.all([
        componentsApi.history(component.id),
        componentsApi.verifications(component.id).catch(() => []),
      ]);
      setHistory(maintenance);
      setVerificationLogs(verifications);
      setScreen("passport");
    } catch (e: any) {
      Alert.alert("Could not open component", e?.response?.data?.message ?? "Component data could not be loaded.");
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
    setAnalytics(null);
    setScreen("home");
  };

  if (boot) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={C.accent} /></SafeAreaView>;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <View style={styles.miniMark}><ShieldCheck color={C.accent} size={17} /></View>
          <View>
            <Text style={styles.brand}>AERO-SENSE</Text>
            <Text style={styles.role}>{user.role.replaceAll("_", " ")}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}><LogOut color={C.muted} size={21} /></TouchableOpacity>
      </View>

      {screen === "home" && <Home analytics={analytics} user={user} refresh={refresh} loading={loading} go={setScreen} />}
      {screen === "components" && <Components data={components} query={query} setQuery={setQuery} onOpen={openComponent} back={() => setScreen("home")} />}
      {screen === "aircraft" && <AircraftList data={aircraft} back={() => setScreen("home")} />}
      {screen === "scan" && <Scan onResult={setResult} result={result} back={() => setScreen("home")} />}
      {screen === "passport" && selected && (
        <Passport
          component={selected}
          history={history}
          verificationLogs={verificationLogs}
          canWrite={user.role === "MAINTENANCE_TECHNICIAN"}
          onMaintenanceSaved={async () => setHistory(await componentsApi.history(selected.id))}
          back={() => setScreen("components")}
        />
      )}
      {screen === "maintenanceLog" && <MaintenanceLog back={() => setScreen("home")} />}

      <View style={styles.nav}>
        {navItems.map(([id, label, Icon]) => (
          <TouchableOpacity key={id} onPress={() => setScreen(id)} style={styles.navItem}>
            <View style={[styles.navPill, screen === id && styles.navPillActive]}>
              <Icon color={screen === id ? C.accent : C.muted} size={18} />
              <Text style={[styles.navText, screen === id && { color: C.accent }]}>{label}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!company.trim() || !email.trim() || !password) {
      Alert.alert("Missing details", "Enter company, email, and password.");
      return;
    }
    setBusy(true);
    try {
      const r = await authApi.login(company.trim(), email.trim(), password);
      await SecureStore.setItemAsync(TOKEN_KEY, r.token);
      onLogin(r.user);
    } catch (e: any) {
      Alert.alert("Sign in failed", e?.response?.data?.message ?? "Invalid credentials or server unavailable.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.login}>
        <View style={styles.logoMark}><ShieldCheck color={C.accent} size={30} /></View>
        <Text style={styles.loginEyebrow}>AEROSPACE COMPONENT INTELLIGENCE</Text>
        <Text style={styles.title}>Aero-Sense</Text>
        <Text style={styles.subtitle}>Secure aircraft component verification</Text>
        <TextInput placeholder="Company" placeholderTextColor={C.muted} value={company} onChangeText={setCompany} style={styles.input} />
        <TextInput placeholder="Email" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput placeholder="Password" placeholderTextColor={C.muted} value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <Button title={busy ? "Signing in…" : "Sign in"} onPress={submit} disabled={busy} />
      </View>
    </SafeAreaView>
  );
}

function Home({ analytics, user, refresh, loading, go }: any) {
  const cards = [
    ["Aircraft", analytics?.total_aircraft ?? 0, "aircraft"],
    ["Components", analytics?.total_components ?? 0, "components"],
    ["Maintenance", analytics?.total_maintenance_records ?? 0, "maintenanceLog"],
    ["Verifications", analytics?.total_verifications ?? 0, "scan"],
  ];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>OPERATIONS OVERVIEW</Text>
      <Text style={styles.title}>Good to see you, {user.name.split(" ")[0]}</Text>
      <Text style={styles.muted}>Your fleet and component intelligence at a glance.</Text>
      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>VERIFICATION HEALTH</Text>
            <Text style={styles.big}>{analytics?.verifications_passed ?? 0}<Text style={styles.muted}> passed</Text></Text>
            <Text style={styles.muted}>{analytics?.total_verifications ?? 0} total verification checks</Text>
          </View>
          <View style={styles.healthIcon}><ShieldCheck color={C.good} size={25} /></View>
        </View>
      </Card>
      <View style={styles.grid}>
        {cards.map(([label, value, id]: any) => (
          <TouchableOpacity key={id} style={styles.stat} onPress={() => go(id)}>
            <Text style={styles.muted}>{label}</Text>
            <Text style={styles.statNum}>{value}</Text>
            <ChevronRight color={C.muted} size={16} />
          </TouchableOpacity>
        ))}
      </View>
      <Button title={loading ? "Syncing…" : "Sync with backend"} onPress={refresh} disabled={loading} icon={<RefreshCw color={C.bg} size={17} />} />
      <TouchableOpacity style={styles.scanCard} onPress={() => go("scan")}>
        <View style={styles.scanIcon}><ScanLine color={C.accent} size={27} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>FAST ACTION</Text>
          <Text style={styles.cardTitle}>Verify component</Text>
          <Text style={styles.muted}>Scan an NFC tag to validate its digital identity.</Text>
        </View>
        <ChevronRight color={C.accent} size={20} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function Components({ data, onOpen, back, query, setQuery }: any) {
  const filtered = useMemo(() => data.filter((x: Component) => `${x.serial_number} ${x.component_type} ${x.manufacturer}`.toLowerCase().includes(query.toLowerCase())), [data, query]);
  return (
    <View style={styles.flex}>
      <View style={styles.subhead}><View><Text style={styles.kicker}>DIGITAL INVENTORY</Text><Text style={styles.title}>Components</Text></View><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
      <View style={styles.searchWrap}><TextInput value={query} onChangeText={setQuery} placeholder="Search serial, type or manufacturer" placeholderTextColor={C.muted} style={styles.search} /></View>
      <FlatList data={filtered} keyExtractor={(x) => String(x.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.muted}>No matching components.</Text>} renderItem={({ item }) => <TouchableOpacity onPress={() => onOpen(item)}><Card><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.serial_number}</Text><Text style={styles.muted}>{item.component_type} · {item.manufacturer}</Text><Text style={styles.tag}>{item.status}</Text></View><ChevronRight color={C.muted} /></View></Card></TouchableOpacity>} />
    </View>
  );
}

function AircraftList({ data, back }: { data: Aircraft[]; back: () => void }) {
  return (
    <View style={styles.flex}>
      <View style={styles.subhead}><View><Text style={styles.kicker}>FLEET REGISTER</Text><Text style={styles.title}>Aircraft</Text></View><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
      <FlatList data={data} keyExtractor={(x) => String(x.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.muted}>No aircraft registered for this company.</Text>} renderItem={({ item }) => <Card><View style={styles.row}><View style={styles.aircraftIcon}><Plane color={C.accent} size={20} /></View><View style={{ flex: 1 }}><Text style={styles.cardEyebrow}>AIRCRAFT REGISTER</Text><Text style={styles.cardTitle}>{item.registration_number}</Text><Text style={styles.muted}>{item.model} · {item.manufacturer}</Text><Text style={styles.tag}>{item.status}</Text></View></View></Card>} />
    </View>
  );
}

function Scan({ onResult, result, back }: { onResult: (r: VerificationResponse | null) => void; result: VerificationResponse | null; back: () => void }) {
  const [busy, setBusy] = useState(false);
  const tone = result?.status === "AUTHENTIC" ? C.good : result?.status === "SUSPICIOUS" ? C.warn : result?.status === "INVALID" ? C.bad : C.accent;

  const scan = async () => {
    setBusy(true);
    onResult(null);
    try {
      if (!(await NfcManager.isSupported())) throw new Error("NFC is not supported on this device.");
      await NfcManager.start();
      await NfcManager.requestTechnology(NfcTech.NfcA, { alertMessage: "Hold the phone near the Aero-Sense NFC tag" });
      const tag: any = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No NFC identifier was read.");
      const identifier = Array.isArray(tag.id) ? tag.id.map((x: number) => x.toString(16).padStart(2, "0")).join("").toUpperCase() : String(tag.id).toUpperCase();
      onResult(await verificationApi.nfc(identifier));
    } catch (e: any) {
      Alert.alert("Scan failed", e?.message ?? "Unable to scan NFC tag.");
    } finally {
      try { await NfcManager.cancelTechnologyRequest(); } catch {}
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.subhead}><View><Text style={styles.kicker}>SECURE TAG CHECK</Text><Text style={styles.title}>NFC Verify</Text></View><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
      <Card><View style={styles.scanHero}><View style={styles.scanRing}><ScanLine color={C.accent} size={42} /></View><Text style={[styles.cardEyebrow, { color: tone }]}>{result?.status ?? "READY TO VERIFY"}</Text><Text style={styles.cardTitle}>Scan a component tag</Text><Text style={styles.muted}>Hold your phone near the registered NFC tag to validate its identity against the backend.</Text><Button title={busy ? "Scanning…" : "Start NFC scan"} onPress={scan} disabled={busy} /></View></Card>
      {result && <Card><View style={[styles.authHeader, { borderColor: tone }]}><View style={[styles.authSeal, { backgroundColor: tone }]}><ShieldCheck color={C.bg} size={27} /></View><View style={{ flex: 1 }}><Text style={styles.cardEyebrow}>VERIFICATION CERTIFICATE</Text><Text style={[styles.result, { color: tone }]}>{result.status}</Text><Text style={styles.muted}>{result.component?.serial_number ?? "Unknown component"}</Text></View></View><Text style={styles.muted}>{result.failure_reason ?? "All available verification checks completed."}</Text>{Object.entries(result.checks).map(([k, v]) => <View style={styles.check} key={k}><Text style={styles.muted}>{k.replaceAll("_", " ")}</Text><Text style={{ color: v ? C.good : C.bad, fontWeight: "800" }}>{v ? "PASS" : "FAIL"}</Text></View>)}</Card>}
    </ScrollView>
  );
}

function MaintenanceLog({ back }: { back: () => void }) {
  const [items, setItems] = useState<MaintenanceRecord[]>([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => { maintenanceApi.list().then(setItems).catch(() => Alert.alert("Load failed", "Could not load maintenance records.")).finally(() => setBusy(false)); }, []);
  return <View style={styles.flex}><View style={styles.subhead}><View><Text style={styles.kicker}>AUDIT TRAIL</Text><Text style={styles.title}>Maintenance</Text></View><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>{busy ? <View style={styles.center}><ActivityIndicator color={C.accent} /></View> : <FlatList data={items} keyExtractor={(x) => String(x.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.muted}>No maintenance records yet.</Text>} renderItem={({ item }) => <Card><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.maintenance_type}</Text><Text style={styles.muted}>{item.description}</Text><Text style={styles.muted}>Component #{item.component_id} · {item.technician_name}</Text><Text style={styles.tag}>{item.record_hash.slice(0, 18)}…</Text></View><Text style={{ color: item.inspection_result === "PASSED" ? C.good : item.inspection_result === "WARNING" ? C.warn : C.bad, fontWeight: "800" }}>{item.inspection_result}</Text></View></Card>} />}</View>;
}

function Passport({ component, history, verificationLogs, back, canWrite, onMaintenanceSaved }: { component: Component; history: MaintenanceRecord[]; verificationLogs: VerificationLog[]; back: () => void; canWrite: boolean; onMaintenanceSaved: () => Promise<void> }) {
  const [tab, setTab] = useState<"overview" | "maintenance" | "verification">("overview");
  const [type, setType] = useState("Inspection");
  const [description, setDescription] = useState("");
  const [parts, setParts] = useState("");
  const [inspection, setInspection] = useState<"PASSED" | "FAILED" | "WARNING">("PASSED");
  const [busy, setBusy] = useState(false);
  const types = ["Inspection", "Repair", "Replacement", "Scheduled Service"];

  const save = async () => {
    if (!description.trim()) { Alert.alert("Description required", "Describe the work that was performed."); return; }
    setBusy(true);
    try {
      await maintenanceApi.create({ component_id: component.id, maintenance_type: type, description: description.trim(), parts_replaced: parts.trim() || undefined, inspection_result: inspection });
      await onMaintenanceSaved();
      setDescription(""); setParts("");
      Alert.alert("Saved", "Maintenance record added to the audit chain.");
    } catch (e: any) {
      Alert.alert("Could not save", e?.response?.data?.message ?? "Maintenance could not be saved.");
    } finally { setBusy(false); }
  };

  return <ScrollView contentContainerStyle={styles.content}><View style={styles.subhead}><View><Text style={styles.kicker}>COMPONENT PASSPORT</Text><Text style={styles.title}>{component.serial_number}</Text></View><TouchableOpacity onPress={back}><Text style={styles.link}>Parts</Text></TouchableOpacity></View><View style={styles.passportHero}><View style={styles.passportBadge}><ShieldCheck color={C.good} size={22} /></View><View style={{ flex: 1 }}><Text style={styles.cardEyebrow}>DIGITAL IDENTITY</Text><Text style={styles.cardTitle}>Component record secured</Text><Text style={styles.muted}>{component.component_type} · {component.manufacturer}</Text></View></View><View style={styles.tabs}>{[["overview", "Overview"], ["maintenance", "Maintenance"], ["verification", "Verification"]].map(([id, label]) => <TouchableOpacity key={id} onPress={() => setTab(id as any)} style={[styles.tab, tab === id && styles.tabActive]}><Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text></TouchableOpacity>)}</View>{tab === "overview" && <Card><Text style={styles.cardEyebrow}>COMPONENT DETAILS</Text><View style={styles.detailGrid}><Detail label="Serial number" value={component.serial_number} /><Detail label="Type" value={component.component_type} /><Detail label="Manufacturer" value={component.manufacturer} /><Detail label="Status" value={component.status} /><Detail label="Aircraft" value={component.aircraft_registration ?? "Unassigned"} /></View></Card>}{tab === "maintenance" && <>{canWrite && <Card><Text style={styles.cardTitle}>Add maintenance</Text><Text style={styles.fieldLabel}>MAINTENANCE TYPE</Text><View style={styles.choiceRow}>{types.map((x) => <TouchableOpacity key={x} onPress={() => setType(x)} style={[styles.choice, type === x && styles.choiceActive]}><Text style={[styles.choiceText, type === x && styles.choiceTextActive]}>{x}</Text></TouchableOpacity>)}</View><TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 90 }]} multiline placeholder="Description" placeholderTextColor={C.muted} /><Text style={styles.fieldLabel}>PARTS REPLACED</Text><TextInput value={parts} onChangeText={setParts} style={styles.input} placeholder="Part numbers or description" placeholderTextColor={C.muted} /><Text style={styles.fieldLabel}>INSPECTION RESULT</Text><View style={styles.choiceRow}>{(["PASSED", "WARNING", "FAILED"] as const).map((x) => <TouchableOpacity key={x} onPress={() => setInspection(x)} style={[styles.choice, inspection === x && styles.choiceActive]}><Text style={[styles.choiceText, inspection === x && styles.choiceTextActive]}>{x}</Text></TouchableOpacity>)}</View><Button title={busy ? "Saving…" : "Save maintenance"} onPress={save} disabled={busy} icon={<Wrench color={C.bg} size={17} />} /></Card>}<Text style={styles.section}>Maintenance history</Text>{history.length === 0 && <Text style={styles.muted}>No maintenance records for this component.</Text>}{history.map((h) => <Card key={h.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{h.maintenance_type}</Text><Text style={styles.muted}>{h.description}</Text><Text style={styles.muted}>{h.technician_name} · {new Date(h.created_at).toLocaleDateString()}</Text></View><Text style={{ color: h.inspection_result === "PASSED" ? C.good : h.inspection_result === "WARNING" ? C.warn : C.bad, fontWeight: "800" }}>{h.inspection_result}</Text></View></Card>)}</>}{tab === "verification" && <><Text style={styles.section}>Verification history</Text>{verificationLogs.length === 0 && <Text style={styles.muted}>No verification records for this component.</Text>}{verificationLogs.map((v) => <Card key={v.id}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{v.final_result ?? "Verification"}</Text><Text style={styles.muted}>{new Date(v.created_at).toLocaleString()}</Text><Text style={styles.muted}>{v.failure_reason ?? "No failure recorded"}</Text></View><Text style={{ color: v.final_result === "AUTHENTIC" ? C.good : C.warn, fontWeight: "800" }}>{v.final_result === "AUTHENTIC" ? "VALID" : "CHECK"}</Text></View></Card>)}</>}</ScrollView>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={{ minWidth: 130 }}><Text style={styles.muted}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }, flex: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: C.line }, headerBrand: { flexDirection: "row", alignItems: "center", gap: 9 }, miniMark: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  brand: { fontSize: 15, fontWeight: "900", letterSpacing: 2, color: C.text }, role: { fontSize: 10, color: C.muted, marginTop: 2 }, content: { padding: 20, paddingBottom: 100, gap: 14 }, login: { flex: 1, padding: 28, justifyContent: "center", gap: 12 }, logoMark: { width: 68, height: 68, borderRadius: 20, backgroundColor: C.panel2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line }, loginEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.8, color: C.accent },
  title: { fontSize: 28, fontWeight: "800", color: C.text }, subtitle: { fontSize: 15, color: C.muted, marginBottom: 20 }, kicker: { fontSize: 10, color: C.accent, fontWeight: "900", letterSpacing: 2 }, cardEyebrow: { fontSize: 10, color: C.muted, fontWeight: "900", letterSpacing: 1.4 },
  healthIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: "#102b24", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#21483b" }, scanIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.bg, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line }, searchWrap: { paddingHorizontal: 20, paddingBottom: 8 }, search: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 13, color: C.text, padding: 13 }, scanHero: { alignItems: "center", gap: 10, paddingVertical: 12 }, scanRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, borderColor: C.accent, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  input: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 12, color: C.text, padding: 14, fontSize: 15 }, button: { backgroundColor: C.accent, padding: 15, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, minHeight: 50 }, buttonText: { color: C.bg, fontWeight: "900" },
  card: { backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 17, gap: 10, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 }, row: { flexDirection: "row", alignItems: "center", gap: 12 }, muted: { color: C.muted, fontSize: 13, lineHeight: 19 }, big: { color: C.text, fontSize: 32, fontWeight: "900", marginTop: 5 }, cardTitle: { color: C.text, fontSize: 16, fontWeight: "800" }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, stat: { width: "48%", backgroundColor: C.panel, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: C.line, minHeight: 95 }, statNum: { color: C.text, fontSize: 25, fontWeight: "900", marginTop: 7 }, scanCard: { backgroundColor: C.panel2, borderRadius: 18, padding: 17, flexDirection: "row", gap: 14, alignItems: "center", borderWidth: 1, borderColor: C.line },
  nav: { position: "absolute", bottom: 0, left: 0, right: 0, height: 74, backgroundColor: C.panel, borderTopWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", paddingBottom: Platform.OS === "ios" ? 8 : 0 }, navItem: { flex: 1, alignItems: "center", paddingVertical: 7 }, navPill: { minWidth: 62, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 12, alignItems: "center", gap: 3 }, navPillActive: { backgroundColor: C.panel2 }, navText: { color: C.muted, fontWeight: "700", fontSize: 10 }, subhead: { paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, link: { color: C.accent, fontWeight: "700" }, list: { padding: 20, paddingBottom: 100, gap: 10 }, tag: { alignSelf: "flex-start", marginTop: 7, color: C.accent, fontSize: 11, fontWeight: "800" }, result: { fontSize: 24, fontWeight: "900" }, authHeader: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, authSeal: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" }, check: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderColor: C.line }, section: { color: C.text, fontSize: 18, fontWeight: "800", marginTop: 5 }, passportHero: { backgroundColor: C.panel2, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 13 }, passportBadge: { width: 46, height: 46, borderRadius: 15, backgroundColor: "#102b24", alignItems: "center", justifyContent: "center" }, tabs: { flexDirection: "row", backgroundColor: C.panel, borderRadius: 13, padding: 4, borderWidth: 1, borderColor: C.line }, tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 }, tabActive: { backgroundColor: C.panel2 }, tabText: { color: C.muted, fontWeight: "700", fontSize: 12 }, tabTextActive: { color: C.accent }, aircraftIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }, detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginTop: 12 }, detailValue: { color: C.text, fontWeight: "800", marginTop: 3, maxWidth: 145 }, fieldLabel: { fontSize: 10, color: C.muted, fontWeight: "900", letterSpacing: 1.2, marginTop: 3 }, choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, choice: { paddingVertical: 10, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg }, choiceActive: { borderColor: C.accent, backgroundColor: C.panel2 }, choiceText: { color: C.muted, fontSize: 12, fontWeight: "700" }, choiceTextActive: { color: C.accent },
});
