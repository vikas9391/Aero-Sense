import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View
} from "react-native";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import * as SecureStore from "expo-secure-store";
import { ShieldCheck, ScanLine, Wrench, LogOut, RefreshCw, ChevronRight } from "lucide-react-native";
import { authApi, analyticsApi, aircraftApi, componentsApi, maintenanceApi, verificationApi } from "./src/api";
import type { Analytics, Aircraft, Component, MaintenanceRecord, User, VerificationResponse } from "./src/types";

const C = { bg:"#071018", panel:"#0d1a24", panel2:"#122331", text:"#f4f8fb", muted:"#8ea3b3", accent:"#6ee7ff", good:"#48e39a", warn:"#ffc857", bad:"#ff6b6b", line:"#1c3445" };

function Button({title,onPress,disabled=false,icon}:any) {
  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button,disabled&&{opacity:.5}]}>
    {icon}{<Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>;
}

function Card({children}:any){return <View style={styles.card}>{children}</View>}

export default function App() {
  const [user,setUser]=useState<User|null>(null);
  const [boot,setBoot]=useState(true);
  const [screen,setScreen]=useState<"home"|"components"|"aircraft"|"scan"|"maintenance"|"maintenanceLog">("home");
  const [analytics,setAnalytics]=useState<Analytics|null>(null);
  const [components,setComponents]=useState<Component[]>([]);
  const [aircraft,setAircraft]=useState<Aircraft[]>([]);
  const [selected,setSelected]=useState<Component|null>(null);
  const [history,setHistory]=useState<MaintenanceRecord[]>([]);
  const [result,setResult]=useState<VerificationResponse|null>(null);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{ (async()=>{
    try { const token=await SecureStore.getItemAsync("aero_sense_token"); if(token) setUser(await authApi.me()); }
    catch {} finally { setBoot(false); }
  })(); },[]);

  const refresh=async()=>{
    if(!user)return;
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
    } catch(e:any){ Alert.alert("Sync failed", e?.response?.data?.message ?? "Could not reach the Aero-Sense backend."); }
    finally { setLoading(false); }
  };
  useEffect(()=>{if(user)refresh()},[user]);

  const logout=async()=>{await SecureStore.deleteItemAsync("aero_sense_token");setUser(null);setAnalytics(null);setScreen("home");};

  if(boot)return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={C.accent}/></SafeAreaView>;
  if(!user)return <Login onLogin={(u)=>setUser(u)}/>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
    <View style={styles.header}>
      <View><Text style={styles.brand}>AERO-SENSE</Text><Text style={styles.role}>{user.role.replaceAll("_"," ")}</Text></View>
      <TouchableOpacity onPress={logout}><LogOut color={C.muted} size={21}/></TouchableOpacity>
    </View>
    {screen==="home"&&<Home analytics={analytics} user={user} refresh={refresh} loading={loading} go={setScreen}/>}
    {screen==="components"&&<Components data={components} onOpen={async(c)=>{setSelected(c);setHistory(await componentsApi.history(c.id));setScreen("maintenance")}} back={()=>setScreen("home")}/>}
    {screen==="aircraft"&&<AircraftList data={aircraft} back={()=>setScreen("home")}/>}
    {screen==="scan"&&<Scan onResult={setResult} result={result} back={()=>setScreen("home")}/>}
    {screen==="maintenance"&&selected&&<Maintenance component={selected} history={history} back={()=>setScreen("components")} canWrite={user.role==="MAINTENANCE_TECHNICIAN"}/>}
    {screen==="maintenanceLog"&&<MaintenanceLog back={()=>setScreen("home")}/>}
    <View style={styles.nav}>
      {([["home","Home"],["components","Parts"],["aircraft","Aircraft"],["scan","Scan"]] as const).map(([id,label])=>
        <TouchableOpacity key={id} onPress={()=>setScreen(id as any)} style={styles.navItem}><Text style={[styles.navText,screen===id&&{color:C.accent}]}>{label}</Text></TouchableOpacity>
      )}
    </View>
  </SafeAreaView>;
}

function Login({onLogin}:{onLogin:(u:User)=>void}) {
  const [company,setCompany]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async()=>{setBusy(true);try{const r=await authApi.login(company,email,password);await SecureStore.setItemAsync("aero_sense_token",r.token);onLogin(r.user)}catch(e:any){Alert.alert("Sign in failed",e?.response?.data?.message??"Invalid credentials or server unavailable.")}finally{setBusy(false)}};
  return <SafeAreaView style={styles.safe}><View style={styles.login}>
    <ShieldCheck color={C.accent} size={46}/><Text style={styles.title}>Aero-Sense</Text><Text style={styles.subtitle}>Aircraft component verification</Text>
    <TextInput placeholder="Company" placeholderTextColor={C.muted} value={company} onChangeText={setCompany} style={styles.input}/>
    <TextInput placeholder="Email" placeholderTextColor={C.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input}/>
    <TextInput placeholder="Password" placeholderTextColor={C.muted} value={password} onChangeText={setPassword} secureTextEntry style={styles.input}/>
    <Button title={busy?"Signing in…":"Sign in"} onPress={submit} disabled={busy}/>
  </View></SafeAreaView>;
}

function Home({analytics,user,refresh,loading,go}:any){
  const cards=[["Aircraft",analytics?.total_aircraft??0,"aircraft"],["Components",analytics?.total_components??0,"components"],["Maintenance",analytics?.total_maintenance_records??0,"maintenanceLog"],["Verifications",analytics?.total_verifications??0,"scan"]];
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>FIELD CONTROL</Text><Text style={styles.title}>Good to see you, {user.name.split(" ")[0]}</Text>
    <Card><View style={styles.row}><View><Text style={styles.muted}>Verification health</Text><Text style={styles.big}>{analytics?.verifications_passed??0}<Text style={styles.muted}> passed</Text></Text></View><ShieldCheck color={C.good} size={34}/></View></Card>
    <View style={styles.grid}>{cards.map(([label,value,id]:any)=><TouchableOpacity key={id} style={styles.stat} onPress={()=>go(id)}><Text style={styles.muted}>{label}</Text><Text style={styles.statNum}>{value}</Text><ChevronRight color={C.muted} size={16}/></TouchableOpacity>)}</View>
    <Button title={loading?"Syncing…":"Sync with backend"} onPress={refresh} disabled={loading} icon={<RefreshCw color={C.bg} size={17}/>}/>
    <TouchableOpacity style={styles.scanCard} onPress={()=>go("scan")}><ScanLine color={C.accent} size={30}/><View style={{flex:1}}><Text style={styles.cardTitle}>Verify component</Text><Text style={styles.muted}>Tap an NFC tag and verify its digital identity.</Text></View></TouchableOpacity>
  </ScrollView>;
}

function Components({data,onOpen,back}:any){
 return <View style={styles.flex}><View style={styles.subhead}><Text style={styles.title}>Components</Text><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
 <FlatList data={data} keyExtractor={(x)=>String(x.id)} contentContainerStyle={styles.list} renderItem={({item})=><TouchableOpacity onPress={()=>onOpen(item)}><Card><View style={styles.row}><View style={{flex:1}}><Text style={styles.cardTitle}>{item.serial_number}</Text><Text style={styles.muted}>{item.component_type} · {item.manufacturer}</Text><Text style={styles.tag}>{item.status}</Text></View><ChevronRight color={C.muted}/></View></Card></TouchableOpacity>}/></View>;
}

function AircraftList({data,back}:any){
 return <View style={styles.flex}><View style={styles.subhead}><Text style={styles.title}>Aircraft</Text><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
 <FlatList data={data} keyExtractor={(x)=>String(x.id)} contentContainerStyle={styles.list} renderItem={({item})=><Card><Text style={styles.cardTitle}>{item.registration_number}</Text><Text style={styles.muted}>{item.model} · {item.manufacturer}</Text><Text style={styles.tag}>{item.status}</Text></Card>}/></View>;
}

function Scan({onResult,result,back}:{onResult:(r:any)=>void,result:any,back:()=>void}){
 const [busy,setBusy]=useState(false);
 const scan=async()=>{
  setBusy(true);onResult(null);
  try{
   const supported=await NfcManager.isSupported(); if(!supported) throw new Error("NFC is not supported on this device.");
   await NfcManager.start(); await NfcManager.requestTechnology(NfcTech.NfcA,{alertMessage:"Hold the phone near the Aero-Sense NFC tag"});
   const tag:any=await NfcManager.getTag(); const id=tag?.id;
   if(!id)throw new Error("No NFC identifier was read.");
   const hex=Array.isArray(id)?id.map((x:number)=>x.toString(16).padStart(2,"0")).join("").toUpperCase():String(id);
   onResult(await verificationApi.nfc(hex));
  }catch(e:any){Alert.alert("Scan failed",e?.message??"Unable to scan NFC tag.");}
  finally{try{await NfcManager.cancelTechnologyRequest()}catch{}setBusy(false)}
 };
 return <ScrollView contentContainerStyle={styles.content}><View style={styles.subhead}><Text style={styles.title}>NFC Verify</Text><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
 <Card><View style={styles.center}><ScanLine color={C.accent} size={62}/><Text style={styles.cardTitle}>Scan a component tag</Text><Text style={styles.muted}>Use the physical NFC tag bound to an aircraft component.</Text><Button title={busy?"Scanning…":"Start NFC scan"} onPress={scan} disabled={busy}/></View></Card>
 {result&&<Card><Text style={[styles.result,result.verified?{color:C.good}:{color:C.bad}]}>{result.status}</Text><Text style={styles.cardTitle}>{result.component?.serial_number??"Unknown component"}</Text><Text style={styles.muted}>{result.failure_reason??"All available verification checks completed."}</Text>{Object.entries(result.checks).map(([k,v]:any)=><View style={styles.check} key={k}><Text style={styles.muted}>{k.replaceAll("_"," ")}</Text><Text style={{color:v?C.good:C.bad,fontWeight:"700"}}>{v?"PASS":"FAIL"}</Text></View>)}</Card>}
 </ScrollView>;
}
function MaintenanceLog({back}:{back:()=>void}){
 const [items,setItems]=useState<MaintenanceRecord[]>([]);
 const [busy,setBusy]=useState(true);
 useEffect(()=>{maintenanceApi.list().then(setItems).catch(()=>Alert.alert("Load failed","Could not load maintenance records.")).finally(()=>setBusy(false))},[]);
 return <View style={styles.flex}><View style={styles.subhead}><Text style={styles.title}>Maintenance</Text><TouchableOpacity onPress={back}><Text style={styles.link}>Home</Text></TouchableOpacity></View>
 {busy?<View style={styles.center}><ActivityIndicator color={C.accent}/></View>:<FlatList data={items} keyExtractor={x=>String(x.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.muted}>No maintenance records yet.</Text>} renderItem={({item})=><Card><View style={styles.row}><View style={{flex:1}}><Text style={styles.cardTitle}>{item.maintenance_type}</Text><Text style={styles.muted}>{item.description}</Text><Text style={styles.muted}>Component #{item.component_id} · {item.technician_name}</Text><Text style={styles.tag}>{item.record_hash.slice(0,18)}…</Text></View><Text style={{color:item.inspection_result==="PASSED"?C.good:item.inspection_result==="WARNING"?C.warn:C.bad,fontWeight:"800"}}>{item.inspection_result}</Text></View></Card>)}/>}
 </View>;
}

function Maintenance({component,history,back,canWrite}:any){
 const [type,setType]=useState("Inspection");const [description,setDescription]=useState("");const [parts,setParts]=useState("");const [result,setResult]=useState<"PASSED"|"FAILED"|"WARNING">("PASSED");const [busy,setBusy]=useState(false);
 const save=async()=>{setBusy(true);try{await maintenanceApi.create({component_id:component.id,maintenance_type:type,description,parts_replaced:parts,inspection_result:result});Alert.alert("Saved","Maintenance record added to the audit chain.");setDescription("");setParts("");}catch(e:any){Alert.alert("Could not save",e?.response?.data?.message??"You may not have technician permissions.")}finally{setBusy(false)}};
 return <ScrollView contentContainerStyle={styles.content}><View style={styles.subhead}><Text style={styles.title}>{component.serial_number}</Text><TouchableOpacity onPress={back}><Text style={styles.link}>Parts</Text></TouchableOpacity></View>
 <Text style={styles.muted}>{component.component_type} · {component.manufacturer}</Text>
 {canWrite&&<Card><Text style={styles.cardTitle}>Add maintenance</Text><TextInput value={type} onChangeText={setType} style={styles.input} placeholder="Maintenance type" placeholderTextColor={C.muted}/><TextInput value={description} onChangeText={setDescription} style={[styles.input,{height:90}]} multiline placeholder="Description" placeholderTextColor={C.muted}/><TextInput value={parts} onChangeText={setParts} style={styles.input} placeholder="Parts replaced (optional)" placeholderTextColor={C.muted}/><Button title={busy?"Saving…":"Save maintenance"} onPress={save} disabled={busy} icon={<Wrench color={C.bg} size={17}/>}/></Card>}
 <Text style={styles.section}>History</Text>{history.map((h:MaintenanceRecord)=><Card key={h.id}><View style={styles.row}><View style={{flex:1}}><Text style={styles.cardTitle}>{h.maintenance_type}</Text><Text style={styles.muted}>{h.description}</Text><Text style={styles.muted}>{h.technician_name} · {new Date(h.created_at).toLocaleDateString()}</Text></View><Text style={{color:h.inspection_result==="PASSED"?C.good:h.inspection_result==="WARNING"?C.warn:C.bad,fontWeight:"800"}}>{h.inspection_result}</Text></View></Card>)}
 </ScrollView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:C.bg},flex:{flex:1,backgroundColor:C.bg},
 header:{paddingHorizontal:20,paddingVertical:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderBottomWidth:1,borderColor:C.line},
 brand:{fontSize:15,fontWeight:"900",letterSpacing:2,color:C.text},role:{fontSize:10,color:C.muted,marginTop:2},content:{padding:20,paddingBottom:100,gap:14},login:{flex:1,padding:28,justifyContent:"center",gap:12},
 title:{fontSize:28,fontWeight:"800",color:C.text},subtitle:{fontSize:15,color:C.muted,marginBottom:20},kicker:{fontSize:11,color:C.accent,fontWeight:"800",letterSpacing:2},
 input:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,color:C.text,padding:14,fontSize:15},button:{backgroundColor:C.accent,padding:14,borderRadius:12,alignItems:"center",justifyContent:"center",flexDirection:"row",gap:8},buttonText:{color:C.bg,fontWeight:"900"},
 card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:16,padding:16,gap:10},row:{flexDirection:"row",alignItems:"center",gap:12},muted:{color:C.muted,fontSize:13,lineHeight:19},big:{color:C.text,fontSize:32,fontWeight:"900",marginTop:5},cardTitle:{color:C.text,fontSize:16,fontWeight:"800"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},stat:{width:"48%",backgroundColor:C.panel,padding:14,borderRadius:14,borderWidth:1,borderColor:C.line},statNum:{color:C.text,fontSize:25,fontWeight:"900",marginTop:7},scanCard:{backgroundColor:C.panel2,borderRadius:16,padding:18,flexDirection:"row",gap:14,alignItems:"center"},nav:{position:"absolute",bottom:0,left:0,right:0,height:70,backgroundColor:C.panel,borderTopWidth:1,borderColor:C.line,flexDirection:"row",justifyContent:"space-around",alignItems:"center"},navItem:{padding:10},navText:{color:C.muted,fontWeight:"700"},subhead:{padding:20,paddingBottom:8,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},link:{color:C.accent,fontWeight:"700"},list:{padding:20,paddingBottom:100,gap:10},tag:{alignSelf:"flex-start",marginTop:7,color:C.accent,fontSize:11,fontWeight:"800"},result:{fontSize:24,fontWeight:"900"},check:{flexDirection:"row",justifyContent:"space-between",paddingVertical:9,borderBottomWidth:1,borderColor:C.line},section:{color:C.text,fontSize:18,fontWeight:"800",marginTop:5}
});