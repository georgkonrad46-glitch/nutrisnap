import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput,
  Modal, Alert, ActivityIndicator, FlatList, Dimensions,
  Platform, StatusBar, KeyboardAvoidingView, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CameraView, useCameraPermissions} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';
import Svg, {Circle, Text as SvgText} from 'react-native-svg';
import {createClient} from '@supabase/supabase-js';

const {height: SH} = Dimensions.get('window');

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_KEY || 'YOUR_OPENAI_KEY_HERE';
const SUPABASE_URL = 'https://odjnwaktupjwgdliwjyc.supabase.co';
const SUPABASE_ANON = 'sb_publishable_k6EWv2aj7IKW0SNlnctVRQ_lR4-m3bL';

const C = {
  bg:'#07090F', card:'#0E1520', card2:'#131E2F',
  accent:'#FF4D1A', glow:'#FF7040', blue:'#00C8FF', teal:'#00E5CC',
  text:'#FFFFFF', sub:'#7A90AA', border:'#1A2640',
  gold:'#FFB800', red:'#FF3D5A', green:'#00E676', purple:'#A855F7',
};

const DIARY_KEY = 'nutrisnap_diary';
const WATER_KEY = 'nutrisnap_water';
const WEIGHT_KEY = 'nutrisnap_weight';
const FAST_KEY = 'nutrisnap_fast';
const PROFILE_KEY = 'nutrisnap_profile';
const WORKOUT_KEY = 'nutrisnap_workouts';

const ACTIVITY_LEVELS = [
  {id:1, label:'Kaum Bewegung', desc:'Bueroarbeit, kaum Sport', factor:1.2},
  {id:2, label:'Leicht aktiv', desc:'1-2x Sport pro Woche', factor:1.375},
  {id:3, label:'Maessig aktiv', desc:'3-4x Sport pro Woche', factor:1.55},
  {id:4, label:'Sehr aktiv', desc:'5-6x Sport pro Woche', factor:1.725},
  {id:5, label:'Extrem aktiv', desc:'Taeglich intensiv', factor:1.9},
];

const GOALS_LIST = [
  {id:'lose', label:'Abnehmen', icon:'trending-down-outline', color:C.blue, adj:-400},
  {id:'maintain', label:'Gewicht halten', icon:'remove-outline', color:C.green, adj:0},
  {id:'gain', label:'Zunehmen', icon:'trending-up-outline', color:C.gold, adj:300},
];

const RECIPES = [
  {id:'r1', name:'Haferbrei', icon:'nutrition-outline', cat:'fruehstueck', cal:320, prot:10, carbs:55, fat:7, time:10, color:C.gold, zutaten:['80g Haferflocken','250ml Milch','1 Banane','1 EL Honig','Zimt']},
  {id:'r2', name:'Ruehrei', icon:'egg-outline', cat:'fruehstueck', cal:280, prot:18, carbs:2, fat:21, time:8, color:C.gold, zutaten:['3 Eier','30ml Milch','10g Butter','Salz und Pfeffer','Schnittlauch']},
  {id:'r3', name:'Smoothie', icon:'leaf-outline', cat:'fruehstueck', cal:180, prot:5, carbs:38, fat:2, time:5, color:C.gold, zutaten:['1 Banane','150g Beeren','200ml Mandelmilch','1 EL Chiasamen','Ingwer']},
  {id:'r4', name:'Porridge', icon:'cafe-outline', cat:'fruehstueck', cal:380, prot:12, carbs:62, fat:9, time:15, color:C.gold, zutaten:['90g Haferflocken','300ml Hafermilch','30g Mandeln','2 EL Ahornsirup','1 Apfel']},
  {id:'r5', name:'Haehnchen & Reis', icon:'restaurant-outline', cat:'mittagessen', cal:520, prot:42, carbs:58, fat:10, time:30, color:C.accent, zutaten:['200g Haehnchenbrust','150g Reis','Brokkoli','Sojasosse','Sesam']},
  {id:'r6', name:'Thunfisch-Salat', icon:'fish-outline', cat:'mittagessen', cal:340, prot:32, carbs:12, fat:18, time:10, color:C.accent, zutaten:['1 Dose Thunfisch','Rucolasalat','Kirschtomaten','Oliven','Olivenoel']},
  {id:'r7', name:'Pasta Bolognese', icon:'pizza-outline', cat:'mittagessen', cal:620, prot:35, carbs:72, fat:18, time:35, color:C.accent, zutaten:['200g Pasta','150g Hackfleisch','1 Dose Tomaten','Zwiebel','Knoblauch']},
  {id:'r8', name:'Linsensuppe', icon:'water-outline', cat:'mittagessen', cal:380, prot:22, carbs:52, fat:6, time:40, color:C.accent, zutaten:['200g rote Linsen','1 Zwiebel','2 Karotten','Kreuzkuemmel','Zitrone']},
  {id:'r9', name:'Buddha Bowl', icon:'flower-outline', cat:'mittagessen', cal:490, prot:18, carbs:68, fat:16, time:25, color:C.accent, zutaten:['100g Quinoa','Kichererbsen','Avocado','Gurkenscheiben','Tahini-Sauce']},
  {id:'r10', name:'Lachs mit Gemuese', icon:'fish-outline', cat:'abendessen', cal:450, prot:38, carbs:22, fat:22, time:25, color:C.blue, zutaten:['180g Lachsfilet','Zucchini','Paprika','Zitrone','Dill']},
  {id:'r11', name:'Ofenhaehnchen', icon:'flame-outline', cat:'abendessen', cal:580, prot:48, carbs:18, fat:28, time:45, color:C.blue, zutaten:['250g Haehnchen','Rosmarin','Thymian','Knoblauch','Kartoffeln']},
  {id:'r12', name:'Omelett', icon:'egg-outline', cat:'abendessen', cal:360, prot:24, carbs:8, fat:26, time:12, color:C.blue, zutaten:['4 Eier','Champignons','Spinat','Fetakaese','Kraeuter']},
  {id:'r13', name:'Joghurt Bowl', icon:'ice-cream-outline', cat:'snack', cal:220, prot:14, carbs:28, fat:5, time:5, color:C.teal, zutaten:['200g Joghurt','Granola','Beeren','Honig','Minze']},
  {id:'r14', name:'Protein-Shake', icon:'fitness-outline', cat:'snack', cal:180, prot:28, carbs:12, fat:3, time:3, color:C.teal, zutaten:['30g Proteinpulver','250ml Milch','1 Banane','1 EL Erdnussbutter']},
  {id:'r15', name:'Nuss-Mix', icon:'nutrition-outline', cat:'snack', cal:190, prot:5, carbs:8, fat:16, time:1, color:C.teal, zutaten:['30g Mandeln','20g Cashews','20g Walnuesse','Rosinen','Kuerbiskerne']},
];

const WORKOUTS = [
  {id:'w1', name:'Laufen', icon:'walk-outline', met:9.8, color:C.accent},
  {id:'w2', name:'Radfahren', icon:'bicycle-outline', met:7.5, color:C.blue},
  {id:'w3', name:'Schwimmen', icon:'water-outline', met:8.0, color:C.teal},
  {id:'w4', name:'Krafttraining', icon:'barbell-outline', met:5.0, color:C.gold},
  {id:'w5', name:'Yoga', icon:'body-outline', met:3.0, color:C.purple},
  {id:'w6', name:'HIIT', icon:'flash-outline', met:10.5, color:C.red},
  {id:'w7', name:'Wandern', icon:'trail-sign-outline', met:5.5, color:C.green},
  {id:'w8', name:'Tanzen', icon:'musical-notes-outline', met:5.8, color:C.glow},
];

const FASTING_PRESETS = [
  {label:'16:8', fast:16, eat:8},
  {label:'18:6', fast:18, eat:6},
  {label:'20:4', fast:20, eat:4},
  {label:'5:2', fast:36, eat:12},
  {label:'OMAD', fast:23, eat:1},
];

const CATS = [
  {id:'fruehstueck', label:'Fruehstueck', icon:'sunny-outline', color:C.gold},
  {id:'mittagessen', label:'Mittagessen', icon:'partly-sunny-outline', color:C.accent},
  {id:'abendessen', label:'Abendessen', icon:'moon-outline', color:C.blue},
  {id:'snack', label:'Snack', icon:'cafe-outline', color:C.teal},
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

function calcBMI(weight, height) {
  if (!weight || !height || height === 0) return 0;
  const h = height / 100;
  return parseFloat((weight / (h * h)).toFixed(1));
}

function getBMIInfo(bmi) {
  if (!bmi || bmi === 0) return {label:'Unbekannt', color:C.sub};
  if (bmi < 18.5) return {label:'Untergewicht', color:C.blue};
  if (bmi < 25) return {label:'Normalgewicht', color:C.green};
  if (bmi < 30) return {label:'Uebergewicht', color:C.gold};
  return {label:'Adipositas', color:C.red};
}

function calcTDEE(gender, weight, height, birthYear, activityId, goalId) {
  const age = new Date().getFullYear() - (parseInt(birthYear) || 1990);
  let bmr;
  if (gender === 'M') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  const act = ACTIVITY_LEVELS.find(a => a.id === activityId) || ACTIVITY_LEVELS[1];
  const goal = GOALS_LIST.find(g => g.id === goalId) || GOALS_LIST[1];
  return Math.round(bmr * act.factor + goal.adj);
}

function calcWorkoutCal(met, weight, minutes) {
  return Math.round(met * weight * (minutes / 60));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !pass) {Alert.alert('Fehler', 'Bitte alle Felder ausfullen'); return;}
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await supabase.auth.signInWithPassword({email, password: pass});
      } else {
        res = await supabase.auth.signUp({email, password: pass});
      }
      if (res.error) throw res.error;
      if (res.data.session) onAuth(res.data.session);
      else Alert.alert('Bestaetigung', 'Bitte E-Mail bestaetigen');
    } catch (e) {
      Alert.alert('Fehler', e.message || 'Unbekannter Fehler');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[s.fill, {backgroundColor:C.bg, justifyContent:'center', padding:24}]}>
        <View style={{alignItems:'center', marginBottom:40}}>
          <View style={{width:72, height:72, borderRadius:20, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', marginBottom:16}}>
            <Ionicons name="nutrition-outline" size={40} color={C.text} />
          </View>
          <Text style={{color:C.text, fontSize:28, fontWeight:'800'}}>NutriSnap</Text>
          <Text style={{color:C.sub, fontSize:14, marginTop:4}}>Dein smarter Ernaehrungs-Tracker</Text>
        </View>
        <View style={[s.card, {padding:24}]}>
          <View style={{flexDirection:'row', backgroundColor:C.card2, borderRadius:12, padding:4, marginBottom:20}}>
            {['login','register'].map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={{flex:1, paddingVertical:10, borderRadius:10, backgroundColor:mode===m?C.accent:'transparent', alignItems:'center'}}>
                <Text style={{color:C.text, fontWeight:'600'}}>{m==='login'?'Anmelden':'Registrieren'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="E-Mail" placeholderTextColor={C.sub} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={[s.input, {marginTop:12}]} placeholder="Passwort" placeholderTextColor={C.sub} value={pass} onChangeText={setPass} secureTextEntry />
          <TouchableOpacity style={[s.btn, {marginTop:20, backgroundColor:C.accent}]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color={C.text} /> : <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>{mode==='login'?'Anmelden':'Registrieren'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Onboarding Screen ────────────────────────────────────────────────────────
function OnboardingScreen({onComplete}) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('maintain');
  const [gender, setGender] = useState('M');
  const [birthYear, setBirthYear] = useState('1990');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('75');
  const [goalWeight, setGoalWeight] = useState('70');
  const [activity, setActivity] = useState(2);

  const bmi = calcBMI(parseFloat(weight) || 75, parseFloat(height) || 175);
  const bmiInfo = getBMIInfo(bmi);
  const tdee = calcTDEE(gender, parseFloat(weight)||75, parseFloat(height)||175, birthYear, activity, goal);

  async function finish() {
    const p = {
      goal, gender, birthYear,
      height: parseFloat(height)||175,
      weight: parseFloat(weight)||75,
      goalWeight: parseFloat(goalWeight)||70,
      activity, bmi, tdee
    };
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    onComplete(p);
  }

  return (
    <View style={[s.fill, {backgroundColor:C.bg}]}>
      <SafeAreaView style={s.fill}>
        <View style={{padding:24, paddingBottom:0}}>
          <Text style={{color:C.sub, fontSize:13, marginBottom:8}}>Schritt {step+1} von 4</Text>
          <View style={{flexDirection:'row', gap:6}}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{flex:1, height:4, borderRadius:2, backgroundColor:i<=step?C.accent:C.border}} />
            ))}
          </View>
        </View>
        <ScrollView contentContainerStyle={{padding:24, paddingTop:32}} showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <View>
              <Text style={s.h1}>Dein Ziel</Text>
              <Text style={[s.sub2, {marginBottom:24}]}>Was moechtest du mit NutriSnap erreichen?</Text>
              {GOALS_LIST.map(g => (
                <TouchableOpacity key={g.id} onPress={() => setGoal(g.id)} style={[s.card, {padding:20, marginBottom:12, flexDirection:'row', alignItems:'center', borderWidth:2, borderColor:goal===g.id?g.color:C.border}]}>
                  <View style={{width:48, height:48, borderRadius:14, backgroundColor:goal===g.id?g.color+'33':C.card2, alignItems:'center', justifyContent:'center', marginRight:16}}>
                    <Ionicons name={g.icon} size={24} color={goal===g.id?g.color:C.sub} />
                  </View>
                  <Text style={{color:C.text, fontSize:18, fontWeight:'700'}}>{g.label}</Text>
                  {goal===g.id && <Ionicons name="checkmark-circle" size={24} color={g.color} style={{marginLeft:'auto'}} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {step === 1 && (
            <View>
              <Text style={s.h1}>Dein Profil</Text>
              <Text style={[s.sub2, {marginBottom:24}]}>Persoenliche Angaben fuer genaue Berechnungen</Text>
              <Text style={{color:C.sub, fontSize:13, marginBottom:8}}>Geschlecht</Text>
              <View style={{flexDirection:'row', gap:12, marginBottom:20}}>
                {[{id:'M',label:'Maennlich',icon:'male-outline'},{id:'F',label:'Weiblich',icon:'female-outline'}].map(g => (
                  <TouchableOpacity key={g.id} onPress={() => setGender(g.id)} style={{flex:1, padding:20, borderRadius:16, borderWidth:2, borderColor:gender===g.id?C.accent:C.border, backgroundColor:gender===g.id?C.accent+'22':C.card, alignItems:'center'}}>
                    <Ionicons name={g.icon} size={28} color={gender===g.id?C.accent:C.sub} />
                    <Text style={{color:gender===g.id?C.text:C.sub, marginTop:8, fontWeight:'600'}}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{color:C.sub, fontSize:13, marginBottom:8}}>Geburtsjahr</Text>
              <TextInput style={s.input} value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" placeholder="z.B. 1990" placeholderTextColor={C.sub} />
            </View>
          )}
          {step === 2 && (
            <View>
              <Text style={s.h1}>Koerpermasse</Text>
              <Text style={[s.sub2, {marginBottom:24}]}>Fuer BMI und Kalorienberechnung</Text>
              {[
                {label:'Groesse (cm)', val:height, set:setHeight},
                {label:'Aktuelles Gewicht (kg)', val:weight, set:setWeight},
                {label:'Zielgewicht (kg)', val:goalWeight, set:setGoalWeight},
              ].map((f, i) => (
                <View key={i} style={{marginBottom:16}}>
                  <Text style={{color:C.sub, fontSize:13, marginBottom:8}}>{f.label}</Text>
                  <TextInput style={s.input} value={f.val} onChangeText={f.set} keyboardType="numeric" placeholder="0" placeholderTextColor={C.sub} />
                </View>
              ))}
            </View>
          )}
          {step === 3 && (
            <View>
              <Text style={s.h1}>Aktivitaet</Text>
              <Text style={[s.sub2, {marginBottom:20}]}>Wie aktiv bist du im Alltag?</Text>
              {ACTIVITY_LEVELS.map(a => (
                <TouchableOpacity key={a.id} onPress={() => setActivity(a.id)} style={[s.card, {padding:16, marginBottom:10, flexDirection:'row', alignItems:'center', borderWidth:2, borderColor:activity===a.id?C.accent:C.border}]}>
                  <View style={{flex:1}}>
                    <Text style={{color:C.text, fontWeight:'600'}}>{a.label}</Text>
                    <Text style={{color:C.sub, fontSize:12, marginTop:2}}>{a.desc}</Text>
                  </View>
                  {activity===a.id && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
                </TouchableOpacity>
              ))}
              <View style={[s.card, {padding:20, marginTop:16, borderWidth:1, borderColor:C.accent+'66'}]}>
                <Text style={{color:C.accent, fontWeight:'700', fontSize:16, marginBottom:12}}>Deine Zusammenfassung</Text>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                  <Text style={{color:C.sub}}>BMI</Text>
                  <Text style={{color:bmiInfo.color, fontWeight:'700'}}>{bmi} ({bmiInfo.label})</Text>
                </View>
                <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:8}}>
                  <Text style={{color:C.sub}}>Tageskalorien</Text>
                  <Text style={{color:C.text, fontWeight:'700'}}>{tdee} kcal</Text>
                </View>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                  <Text style={{color:C.sub}}>Ziel</Text>
                  <Text style={{color:C.text, fontWeight:'700'}}>{GOALS_LIST.find(g => g.id===goal)?.label}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={{padding:24, flexDirection:'row', gap:12}}>
          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(step-1)} style={[s.btn, {flex:1, backgroundColor:C.card2, borderWidth:1, borderColor:C.border}]}>
              <Text style={{color:C.text, fontWeight:'700'}}>Zurueck</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity onPress={() => setStep(step+1)} style={[s.btn, {flex:1, backgroundColor:C.accent}]}>
              <Text style={{color:C.text, fontWeight:'700'}}>Weiter</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={finish} style={[s.btn, {flex:1, backgroundColor:C.accent}]}>
              <Ionicons name="rocket-outline" size={18} color={C.text} style={{marginRight:8}} />
              <Text style={{color:C.text, fontWeight:'700'}}>NutriSnap starten</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({diary, water, setWater, profile, workouts}) {
  const today = todayStr();
  const todayEntries = diary[today] || [];
  const totalCal = todayEntries.reduce((a, e) => a + e.cal, 0);
  const totalProt = todayEntries.reduce((a, e) => a + (e.prot||0), 0);
  const totalCarbs = todayEntries.reduce((a, e) => a + (e.carbs||0), 0);
  const totalFat = todayEntries.reduce((a, e) => a + (e.fat||0), 0);
  const todayWorkouts = workouts[today] || [];
  const burnedCal = todayWorkouts.reduce((a, w) => a + w.burned, 0);
  const goal = profile?.tdee || 2000;
  const netCal = totalCal - burnedCal;
  const bmi = profile?.bmi || 0;
  const bmiInfo = getBMIInfo(bmi);
  const waterGlasses = water[today] || 0;
  const prog = Math.min(netCal / goal, 1);

  return (
    <ScrollView style={{flex:1, backgroundColor:C.bg}} contentContainerStyle={{padding:16, paddingBottom:80}} showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20, marginTop:8}}>
        <View>
          <Text style={{color:C.sub, fontSize:13}}>Heute</Text>
          <Text style={{color:C.text, fontSize:22, fontWeight:'800'}}>Uebersicht</Text>
        </View>
        {bmi > 0 && (
          <View style={{backgroundColor:bmiInfo.color+'22', borderWidth:1, borderColor:bmiInfo.color, borderRadius:12, paddingHorizontal:12, paddingVertical:6, alignItems:'center'}}>
            <Text style={{color:bmiInfo.color, fontWeight:'800', fontSize:18}}>{bmi}</Text>
            <Text style={{color:bmiInfo.color, fontSize:10, fontWeight:'600'}}>BMI</Text>
          </View>
        )}
      </View>

      <View style={[s.card, {padding:20, marginBottom:16}]}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
          <View>
            <Text style={{color:C.sub, fontSize:12}}>Gegessen</Text>
            <Text style={{color:C.text, fontSize:32, fontWeight:'800'}}>{totalCal}</Text>
            <Text style={{color:C.sub, fontSize:11}}>kcal</Text>
          </View>
          <View style={{width:90, height:90}}>
            <Svg width={90} height={90}>
              <Circle cx={45} cy={45} r={36} stroke={C.border} strokeWidth={8} fill="none" />
              <Circle cx={45} cy={45} r={36} stroke={prog>0.9?C.red:C.accent} strokeWidth={8} fill="none"
                strokeDasharray={2*Math.PI*36} strokeDashoffset={2*Math.PI*36*(1-prog)}
                strokeLinecap="round" transform="rotate(-90 45 45)" />
              <SvgText x={45} y={42} textAnchor="middle" fill={C.text} fontSize={14} fontWeight="bold">{Math.round(prog*100)}%</SvgText>
              <SvgText x={45} y={56} textAnchor="middle" fill={C.sub} fontSize={9}>Ziel</SvgText>
            </Svg>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={{color:C.sub, fontSize:12}}>Ziel</Text>
            <Text style={{color:C.text, fontSize:32, fontWeight:'800'}}>{goal}</Text>
            <Text style={{color:C.sub, fontSize:11}}>kcal</Text>
          </View>
        </View>
        {burnedCal > 0 && (
          <View style={{flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderTopWidth:1, borderTopColor:C.border, marginBottom:4}}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Ionicons name="flame-outline" size={15} color={C.red} style={{marginRight:4}} />
              <Text style={{color:C.sub, fontSize:13}}>Verbrannt</Text>
            </View>
            <Text style={{color:C.red, fontWeight:'700'}}>-{burnedCal} kcal</Text>
          </View>
        )}
        <View style={{flexDirection:'row', justifyContent:'space-between', paddingTop:8, borderTopWidth:1, borderTopColor:C.border}}>
          <View style={{alignItems:'center'}}>
            <Text style={{color:C.teal, fontWeight:'700'}}>{totalProt}g</Text>
            <Text style={{color:C.sub, fontSize:11}}>Protein</Text>
          </View>
          <View style={{alignItems:'center'}}>
            <Text style={{color:C.gold, fontWeight:'700'}}>{totalCarbs}g</Text>
            <Text style={{color:C.sub, fontSize:11}}>Kohlenhydrate</Text>
          </View>
          <View style={{alignItems:'center'}}>
            <Text style={{color:C.purple, fontWeight:'700'}}>{totalFat}g</Text>
            <Text style={{color:C.sub, fontSize:11}}>Fett</Text>
          </View>
          <View style={{alignItems:'center'}}>
            <Text style={{color:netCal > goal ? C.red : C.green, fontWeight:'700'}}>{netCal}</Text>
            <Text style={{color:C.sub, fontSize:11}}>Netto</Text>
          </View>
        </View>
      </View>

      <View style={[s.card, {padding:16, marginBottom:16}]}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <Text style={{color:C.text, fontWeight:'700'}}>Wasser</Text>
          <Text style={{color:C.blue, fontWeight:'700'}}>{waterGlasses} / 8 Glaeser</Text>
        </View>
        <View style={{flexDirection:'row', gap:6, marginBottom:10}}>
          {Array(8).fill(0).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setWater(i+1)} style={{flex:1, height:32, borderRadius:8, backgroundColor:i<waterGlasses?C.blue:C.card2, alignItems:'center', justifyContent:'center'}}>
              <Ionicons name="water" size={13} color={i<waterGlasses?C.bg:C.border} />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => setWater(Math.max(0, waterGlasses-1))} style={{alignSelf:'flex-end'}}>
          <Text style={{color:C.sub, fontSize:12}}>Zurueck</Text>
        </TouchableOpacity>
      </View>

      {todayWorkouts.length > 0 && (
        <View style={[s.card, {padding:16, marginBottom:16}]}>
          <Text style={{color:C.text, fontWeight:'700', marginBottom:12}}>Heutige Workouts</Text>
          {todayWorkouts.map((w, i) => {
            const wt = WORKOUTS.find(x => x.id===w.workoutId);
            return (
              <View key={i} style={{flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:i<todayWorkouts.length-1?1:0, borderBottomColor:C.border}}>
                <View style={{width:36, height:36, borderRadius:10, backgroundColor:(wt?.color||C.accent)+'22', alignItems:'center', justifyContent:'center', marginRight:12}}>
                  <Ionicons name={wt?.icon||'fitness-outline'} size={18} color={wt?.color||C.accent} />
                </View>
                <View style={{flex:1}}>
                  <Text style={{color:C.text, fontWeight:'600'}}>{wt?.name||'Workout'}</Text>
                  <Text style={{color:C.sub, fontSize:12}}>{w.minutes} Min.</Text>
                </View>
                <Text style={{color:C.red, fontWeight:'700'}}>-{w.burned} kcal</Text>
              </View>
            );
          })}
        </View>
      )}

      {CATS.map(cat => {
        const entries = todayEntries.filter(e => e.cat===cat.id);
        if (entries.length === 0) return null;
        return (
          <View key={cat.id} style={[s.card, {padding:16, marginBottom:12}]}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
              <Ionicons name={cat.icon} size={16} color={cat.color} style={{marginRight:6}} />
              <Text style={{color:cat.color, fontWeight:'700'}}>{cat.label}</Text>
              <Text style={{color:C.sub, marginLeft:'auto', fontSize:12}}>{entries.reduce((a,e) => a+e.cal, 0)} kcal</Text>
            </View>
            {entries.map((e, i) => (
              <View key={i} style={{flexDirection:'row', paddingVertical:6, borderBottomWidth:i<entries.length-1?1:0, borderBottomColor:C.border}}>
                <Text style={{flex:1, color:C.text, fontSize:14}}>{e.name}</Text>
                <Text style={{color:C.sub, fontSize:13}}>{e.prot||0}p {e.carbs||0}k {e.fat||0}f</Text>
                <Text style={{color:C.text, fontWeight:'600', marginLeft:12, fontSize:14}}>{e.cal}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({result, onAdd}) {
  return (
    <View style={[s.card, {padding:16, marginTop:12, borderWidth:1, borderColor:C.accent+'66'}]}>
      <Text style={{color:C.accent, fontWeight:'700', fontSize:16, marginBottom:8}}>{result.name}</Text>
      <View style={{flexDirection:'row', justifyContent:'space-around', marginBottom:12}}>
        {[{l:'Kcal',v:result.cal,c:C.accent},{l:'Protein',v:(result.prot||0)+'g',c:C.teal},{l:'Kohlenh.',v:(result.carbs||0)+'g',c:C.gold},{l:'Fett',v:(result.fat||0)+'g',c:C.purple}].map((m, i) => (
          <View key={i} style={{alignItems:'center'}}>
            <Text style={{color:m.c, fontWeight:'700', fontSize:18}}>{m.v}</Text>
            <Text style={{color:C.sub, fontSize:11}}>{m.l}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[s.btn, {backgroundColor:C.accent}]} onPress={onAdd}>
        <Ionicons name="add-circle-outline" size={18} color={C.text} style={{marginRight:8}} />
        <Text style={{color:C.text, fontWeight:'700'}}>Hinzufuegen</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Scan Screen ──────────────────────────────────────────────────────────────
function ScanScreen({onAdd}) {
  const [mode, setMode] = useState('ki');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cat, setCat] = useState('mittagessen');
  const [manName, setManName] = useState('');
  const [manCal, setManCal] = useState('');
  const [manProt, setManProt] = useState('');
  const [manCarbs, setManCarbs] = useState('');
  const [manFat, setManFat] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [recCat, setRecCat] = useState('alle');
  const [recDetail, setRecDetail] = useState(null);

  useEffect(() => {
    (async () => {
      const {status} = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function pickAndAnalyze() {
    const res = await ImagePicker.launchImageLibraryAsync({base64:true, quality:0.7});
    if (res.canceled) return;
    setLoading(true);
    try {
      const b64 = res.assets[0].base64;
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {'Content-Type':'application/json', 'Authorization':'Bearer '+API_KEY},
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{role:'user', content:[
            {type:'text', text:'Analysiere dieses Essen. Antworte NUR mit JSON: {"name":"...","cal":0,"prot":0,"carbs":0,"fat":0}'},
            {type:'image_url', image_url:{url:'data:image/jpeg;base64,'+b64}}
          ]}],
          max_tokens: 200
        })
      });
      const data = await resp.json();
      const txt = data.choices[0].message.content;
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) setResult(JSON.parse(match[0]));
    } catch(e) {
      Alert.alert('Fehler', 'KI-Analyse fehlgeschlagen');
    }
    setLoading(false);
  }

  async function handleBarcode({data: code}) {
    if (loading) return;
    setScanning(false);
    setLoading(true);
    try {
      const r = await fetch('https://world.openfoodfacts.org/api/v0/product/'+code+'.json');
      const d = await r.json();
      if (d.status !== 1) throw new Error('Produkt nicht gefunden');
      const n = d.product.nutriments;
      setResult({
        name: d.product.product_name || 'Unbekannt',
        cal: Math.round(n['energy-kcal_100g']||0),
        prot: Math.round(n.proteins_100g||0),
        carbs: Math.round(n.carbohydrates_100g||0),
        fat: Math.round(n.fat_100g||0),
      });
    } catch(e) {
      Alert.alert('Fehler', e.message);
    }
    setLoading(false);
  }

  function addResult() {
    if (!result) return;
    onAdd({...result, cat, date:todayStr()});
    setResult(null);
    Alert.alert('Hinzugefuegt', result.name+' wurde zum Tagebuch hinzugefuegt');
  }

  function addManual() {
    if (!manName || !manCal) {Alert.alert('Fehler', 'Name und Kalorien erforderlich'); return;}
    onAdd({name:manName, cal:parseInt(manCal)||0, prot:parseInt(manProt)||0, carbs:parseInt(manCarbs)||0, fat:parseInt(manFat)||0, cat, date:todayStr()});
    setManName(''); setManCal(''); setManProt(''); setManCarbs(''); setManFat('');
    Alert.alert('Hinzugefuegt', 'Eintrag wurde gespeichert');
  }

  const filtRecipes = recCat === 'alle' ? RECIPES : RECIPES.filter(r => r.cat===recCat);

  const MODES = [
    {id:'ki', label:'KI-Scan', icon:'scan-outline'},
    {id:'barcode', label:'Barcode', icon:'barcode-outline'},
    {id:'rezepte', label:'Rezepte', icon:'book-outline'},
    {id:'manuell', label:'Manuell', icon:'create-outline'},
  ];

  return (
    <ScrollView style={{flex:1, backgroundColor:C.bg}} contentContainerStyle={{paddingBottom:80}} showsVerticalScrollIndicator={false}>
      <View style={{padding:16}}>
        <Text style={{color:C.text, fontSize:22, fontWeight:'800', marginBottom:16, marginTop:8}}>Eintrag hinzufuegen</Text>

        <View style={{flexDirection:'row', backgroundColor:C.card, borderRadius:14, padding:4, marginBottom:16}}>
          {MODES.map(m => (
            <TouchableOpacity key={m.id} onPress={() => {setMode(m.id); setResult(null); setScanning(false);}} style={{flex:1, paddingVertical:10, borderRadius:10, backgroundColor:mode===m.id?C.accent:'transparent', alignItems:'center'}}>
              <Ionicons name={m.icon} size={16} color={mode===m.id?C.text:C.sub} />
              <Text style={{color:mode===m.id?C.text:C.sub, fontSize:10, marginTop:2}}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{flexDirection:'row', gap:8, marginBottom:16}}>
          {CATS.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setCat(c.id)} style={{flex:1, paddingVertical:8, borderRadius:10, backgroundColor:cat===c.id?c.color+'33':C.card, borderWidth:1, borderColor:cat===c.id?c.color:C.border, alignItems:'center'}}>
              <Ionicons name={c.icon} size={14} color={cat===c.id?c.color:C.sub} />
              <Text style={{color:cat===c.id?c.color:C.sub, fontSize:9, marginTop:2}}>{c.label.slice(0,6)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'ki' && (
          <View>
            <TouchableOpacity style={[s.btn, {backgroundColor:C.accent, marginBottom:12}]} onPress={pickAndAnalyze} disabled={loading}>
              {loading ? <ActivityIndicator color={C.text} /> : (
                <>
                  <Ionicons name="camera-outline" size={20} color={C.text} style={{marginRight:8}} />
                  <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>Foto analysieren</Text>
                </>
              )}
            </TouchableOpacity>
            {result && <ResultCard result={result} onAdd={addResult} />}
          </View>
        )}

        {mode === 'barcode' && (
          <View>
            {!scanning ? (
              <TouchableOpacity style={[s.btn, {backgroundColor:C.blue}]} onPress={() => setScanning(true)}>
                <Ionicons name="barcode-outline" size={20} color={C.text} style={{marginRight:8}} />
                <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>Scanner starten</Text>
              </TouchableOpacity>
            ) : (
              <View style={{height:280, borderRadius:16, overflow:'hidden', marginBottom:12}}>
                {hasPermission ? (
                  <CameraView style={{flex:1}} barcodeScannerSettings={{barcodeTypes:['ean13','ean8','upc_a']}} onBarcodeScanned={handleBarcode}>
                    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                      <View style={{width:200, height:100, borderWidth:2, borderColor:C.accent, borderRadius:8}} />
                    </View>
                  </CameraView>
                ) : (
                  <View style={{flex:1, backgroundColor:C.card, justifyContent:'center', alignItems:'center'}}>
                    <Text style={{color:C.sub}}>Kein Kamerazugriff</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setScanning(false)} style={{position:'absolute', top:12, right:12, backgroundColor:C.card, borderRadius:20, padding:8}}>
                  <Ionicons name="close" size={20} color={C.text} />
                </TouchableOpacity>
              </View>
            )}
            {loading && <ActivityIndicator color={C.accent} style={{marginTop:16}} />}
            {result && <ResultCard result={result} onAdd={addResult} />}
          </View>
        )}

        {mode === 'rezepte' && (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
              {[{id:'alle',label:'Alle'},{id:'fruehstueck',label:'Fruehstueck'},{id:'mittagessen',label:'Mittag'},{id:'abendessen',label:'Abend'},{id:'snack',label:'Snack'}].map(c => (
                <TouchableOpacity key={c.id} onPress={() => setRecCat(c.id)} style={{paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:recCat===c.id?C.accent:C.card, marginRight:8, borderWidth:1, borderColor:recCat===c.id?C.accent:C.border}}>
                  <Text style={{color:recCat===c.id?C.text:C.sub, fontWeight:'600', fontSize:13}}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {filtRecipes.map(r => (
              <TouchableOpacity key={r.id} onPress={() => setRecDetail(r)} style={[s.card, {padding:16, marginBottom:10, flexDirection:'row', alignItems:'center'}]}>
                <View style={{width:48, height:48, borderRadius:14, backgroundColor:r.color+'22', alignItems:'center', justifyContent:'center', marginRight:12}}>
                  <Ionicons name={r.icon} size={24} color={r.color} />
                </View>
                <View style={{flex:1}}>
                  <Text style={{color:C.text, fontWeight:'700', fontSize:15}}>{r.name}</Text>
                  <Text style={{color:C.sub, fontSize:12}}>{r.cal} kcal  |  {r.time} Min.</Text>
                </View>
                <View style={{alignItems:'flex-end'}}>
                  <Text style={{color:C.teal, fontSize:12}}>{r.prot}p</Text>
                  <Text style={{color:C.gold, fontSize:12}}>{r.carbs}k</Text>
                  <Text style={{color:C.purple, fontSize:12}}>{r.fat}f</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {mode === 'manuell' && (
          <View style={[s.card, {padding:20}]}>
            <TextInput style={[s.input, {marginBottom:10}]} placeholder="Name" placeholderTextColor={C.sub} value={manName} onChangeText={setManName} />
            <TextInput style={[s.input, {marginBottom:10}]} placeholder="Kalorien (kcal)" placeholderTextColor={C.sub} value={manCal} onChangeText={setManCal} keyboardType="numeric" />
            <View style={{flexDirection:'row', gap:10, marginBottom:10}}>
              <TextInput style={[s.input, {flex:1}]} placeholder="Protein g" placeholderTextColor={C.sub} value={manProt} onChangeText={setManProt} keyboardType="numeric" />
              <TextInput style={[s.input, {flex:1}]} placeholder="Kohlenh. g" placeholderTextColor={C.sub} value={manCarbs} onChangeText={setManCarbs} keyboardType="numeric" />
              <TextInput style={[s.input, {flex:1}]} placeholder="Fett g" placeholderTextColor={C.sub} value={manFat} onChangeText={setManFat} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={[s.btn, {backgroundColor:C.accent}]} onPress={addManual}>
              <Ionicons name="add-circle-outline" size={18} color={C.text} style={{marginRight:8}} />
              <Text style={{color:C.text, fontWeight:'700'}}>Hinzufuegen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={!!recDetail} transparent animationType="slide" onRequestClose={() => setRecDetail(null)}>
        <View style={{flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end'}}>
          <View style={{backgroundColor:C.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:SH*0.85}}>
            {recDetail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:16}}>
                  <View style={{width:56, height:56, borderRadius:16, backgroundColor:recDetail.color+'22', alignItems:'center', justifyContent:'center', marginRight:14}}>
                    <Ionicons name={recDetail.icon} size={28} color={recDetail.color} />
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{color:C.text, fontSize:20, fontWeight:'800'}}>{recDetail.name}</Text>
                    <Text style={{color:C.sub, fontSize:13}}>{recDetail.time} Min. Zubereitungszeit</Text>
                  </View>
                  <TouchableOpacity onPress={() => setRecDetail(null)}>
                    <Ionicons name="close-circle" size={28} color={C.sub} />
                  </TouchableOpacity>
                </View>
                <View style={{flexDirection:'row', justifyContent:'space-around', backgroundColor:C.card2, borderRadius:16, padding:16, marginBottom:16}}>
                  {[{label:'Kalorien',val:recDetail.cal,unit:'kcal',c:C.accent},{label:'Protein',val:recDetail.prot,unit:'g',c:C.teal},{label:'Kohlenh.',val:recDetail.carbs,unit:'g',c:C.gold},{label:'Fett',val:recDetail.fat,unit:'g',c:C.purple}].map((m, i) => (
                    <View key={i} style={{alignItems:'center'}}>
                      <Text style={{color:m.c, fontSize:18, fontWeight:'800'}}>{m.val}</Text>
                      <Text style={{color:C.sub, fontSize:11}}>{m.unit}</Text>
                      <Text style={{color:C.sub, fontSize:10, marginTop:2}}>{m.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{color:C.text, fontWeight:'700', fontSize:16, marginBottom:12}}>Zutaten</Text>
                {recDetail.zutaten.map((z, i) => (
                  <View key={i} style={{flexDirection:'row', alignItems:'center', paddingVertical:8, borderBottomWidth:i<recDetail.zutaten.length-1?1:0, borderBottomColor:C.border}}>
                    <View style={{width:6, height:6, borderRadius:3, backgroundColor:recDetail.color, marginRight:12}} />
                    <Text style={{color:C.text, fontSize:14}}>{z}</Text>
                  </View>
                ))}
                <TouchableOpacity style={[s.btn, {backgroundColor:C.accent, marginTop:20}]} onPress={() => {
                  onAdd({name:recDetail.name, cal:recDetail.cal, prot:recDetail.prot, carbs:recDetail.carbs, fat:recDetail.fat, cat, date:todayStr()});
                  setRecDetail(null);
                  Alert.alert('Hinzugefuegt', recDetail.name+' wurde zum Tagebuch hinzugefuegt');
                }}>
                  <Ionicons name="add-circle-outline" size={18} color={C.text} style={{marginRight:8}} />
                  <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>Zum Tagebuch hinzufuegen</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Verlauf Screen ───────────────────────────────────────────────────────────
function VerlaufScreen({diary, workouts, setWorkouts, profile}) {
  const [tab, setTab] = useState('essen');
  const [workoutModal, setWorkoutModal] = useState(false);
  const [selWorkout, setSelWorkout] = useState(null);
  const [wMinutes, setWMinutes] = useState('30');
  const weight = profile?.weight || 75;

  const days = Object.keys(diary).sort((a, b) => b.localeCompare(a)).slice(0, 30);
  const wDays = Object.keys(workouts).sort((a, b) => b.localeCompare(a)).slice(0, 30);

  function saveWorkout() {
    if (!selWorkout || !wMinutes) {Alert.alert('Fehler', 'Workout und Dauer waehlen'); return;}
    const mins = parseInt(wMinutes) || 0;
    const burned = calcWorkoutCal(selWorkout.met, weight, mins);
    const today = todayStr();
    const entry = {workoutId:selWorkout.id, minutes:mins, burned, ts:Date.now()};
    const updated = {...workouts, [today]: [...(workouts[today]||[]), entry]};
    setWorkouts(updated);
    setWorkoutModal(false);
    setSelWorkout(null);
    setWMinutes('30');
  }

  return (
    <View style={{flex:1, backgroundColor:C.bg}}>
      <View style={{padding:16, paddingBottom:0}}>
        <Text style={{color:C.text, fontSize:22, fontWeight:'800', marginBottom:16, marginTop:8}}>Verlauf</Text>
        <View style={{flexDirection:'row', backgroundColor:C.card, borderRadius:12, padding:4, marginBottom:16}}>
          {[{id:'essen',label:'Essen',icon:'restaurant-outline'},{id:'sport',label:'Sport',icon:'fitness-outline'}].map(t => (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={{flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center', paddingVertical:10, borderRadius:10, backgroundColor:tab===t.id?C.accent:'transparent'}}>
              <Ionicons name={t.icon} size={15} color={tab===t.id?C.text:C.sub} style={{marginRight:6}} />
              <Text style={{color:tab===t.id?C.text:C.sub, fontWeight:'600'}}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'essen' ? (
        <FlatList
          data={days}
          keyExtractor={d => d}
          contentContainerStyle={{padding:16, paddingTop:0, paddingBottom:80}}
          showsVerticalScrollIndicator={false}
          renderItem={({item:date}) => {
            const entries = diary[date] || [];
            const total = entries.reduce((a, e) => a+e.cal, 0);
            return (
              <View style={[s.card, {padding:16, marginBottom:10}]}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                  <Text style={{color:C.text, fontWeight:'700'}}>{date === todayStr() ? 'Heute' : date}</Text>
                  <Text style={{color:C.accent, fontWeight:'700'}}>{total} kcal</Text>
                </View>
                {entries.slice(0,3).map((e, i) => (
                  <View key={i} style={{flexDirection:'row', paddingVertical:4}}>
                    <Text style={{flex:1, color:C.sub, fontSize:13}}>{e.name}</Text>
                    <Text style={{color:C.text, fontSize:13}}>{e.cal} kcal</Text>
                  </View>
                ))}
                {entries.length > 3 && <Text style={{color:C.sub, fontSize:12, marginTop:4}}>+ {entries.length-3} weitere</Text>}
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{color:C.sub, textAlign:'center', marginTop:40}}>Noch keine Eintraege</Text>}
        />
      ) : (
        <View style={{flex:1}}>
          <FlatList
            data={wDays}
            keyExtractor={d => d}
            contentContainerStyle={{padding:16, paddingTop:0, paddingBottom:80}}
            showsVerticalScrollIndicator={false}
            renderItem={({item:date}) => {
              const wList = workouts[date] || [];
              const totalBurned = wList.reduce((a, w) => a+w.burned, 0);
              return (
                <View style={[s.card, {padding:16, marginBottom:10}]}>
                  <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                    <Text style={{color:C.text, fontWeight:'700'}}>{date === todayStr() ? 'Heute' : date}</Text>
                    <Text style={{color:C.red, fontWeight:'700'}}>-{totalBurned} kcal</Text>
                  </View>
                  {wList.map((w, i) => {
                    const wt = WORKOUTS.find(x => x.id===w.workoutId);
                    return (
                      <View key={i} style={{flexDirection:'row', alignItems:'center', paddingVertical:6, borderBottomWidth:i<wList.length-1?1:0, borderBottomColor:C.border}}>
                        <View style={{width:32, height:32, borderRadius:8, backgroundColor:(wt?.color||C.accent)+'22', alignItems:'center', justifyContent:'center', marginRight:10}}>
                          <Ionicons name={wt?.icon||'fitness-outline'} size={16} color={wt?.color||C.accent} />
                        </View>
                        <View style={{flex:1}}>
                          <Text style={{color:C.text, fontSize:13, fontWeight:'600'}}>{wt?.name||'Workout'}</Text>
                          <Text style={{color:C.sub, fontSize:11}}>{w.minutes} Min.</Text>
                        </View>
                        <Text style={{color:C.red, fontWeight:'600', fontSize:13}}>-{w.burned} kcal</Text>
                      </View>
                    );
                  })}
                </View>
              );
            }}
            ListEmptyComponent={<Text style={{color:C.sub, textAlign:'center', marginTop:40}}>Noch keine Workouts</Text>}
          />
          <TouchableOpacity onPress={() => setWorkoutModal(true)} style={{position:'absolute', bottom:90, right:16, width:56, height:56, borderRadius:28, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', elevation:4}}>
            <Ionicons name="add" size={28} color={C.text} />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={workoutModal} transparent animationType="slide" onRequestClose={() => setWorkoutModal(false)}>
        <View style={{flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end'}}>
          <View style={{backgroundColor:C.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:SH*0.8}}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
              <Text style={{color:C.text, fontSize:18, fontWeight:'800'}}>Workout hinzufuegen</Text>
              <TouchableOpacity onPress={() => setWorkoutModal(false)}>
                <Ionicons name="close-circle" size={26} color={C.sub} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{color:C.sub, fontSize:13, marginBottom:10}}>Sportart</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16}}>
                {WORKOUTS.map(w => (
                  <TouchableOpacity key={w.id} onPress={() => setSelWorkout(w)} style={{flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:8, borderRadius:12, backgroundColor:selWorkout?.id===w.id?w.color+'33':C.card2, borderWidth:1, borderColor:selWorkout?.id===w.id?w.color:C.border}}>
                    <Ionicons name={w.icon} size={16} color={selWorkout?.id===w.id?w.color:C.sub} style={{marginRight:6}} />
                    <Text style={{color:selWorkout?.id===w.id?w.color:C.sub, fontSize:13, fontWeight:'600'}}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{color:C.sub, fontSize:13, marginBottom:8}}>Dauer (Minuten)</Text>
              <TextInput style={[s.input, {marginBottom:12}]} value={wMinutes} onChangeText={setWMinutes} keyboardType="number-pad" placeholder="30" placeholderTextColor={C.sub} />
              {selWorkout && wMinutes ? (
                <View style={{backgroundColor:C.card2, borderRadius:12, padding:16, marginBottom:16, alignItems:'center'}}>
                  <Text style={{color:C.sub, fontSize:13}}>Geschaetzte Verbrennung</Text>
                  <Text style={{color:C.red, fontSize:28, fontWeight:'800', marginTop:4}}>
                    {calcWorkoutCal(selWorkout.met, weight, parseInt(wMinutes)||0)} kcal
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity style={[s.btn, {backgroundColor:C.accent}]} onPress={saveWorkout}>
                <Ionicons name="checkmark-circle-outline" size={18} color={C.text} style={{marginRight:8}} />
                <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>Speichern</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Fasten Screen ────────────────────────────────────────────────────────────
function FastenScreen({fastState, setFastState}) {
  const [selPreset, setSelPreset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const preset = FASTING_PRESETS[selPreset];
  const fastSec = preset.fast * 3600;

  useEffect(() => {
    if (fastState?.active && fastState?.startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - fastState.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [fastState]);

  function toggleFast() {
    if (fastState?.active) {
      clearInterval(timerRef.current);
      setFastState(null);
      setElapsed(0);
    } else {
      setFastState({active:true, startTime:Date.now(), preset:selPreset});
    }
  }

  const prog = Math.min(elapsed / fastSec, 1);
  const rem = Math.max(fastSec - elapsed, 0);
  const remH = Math.floor(rem/3600);
  const remM = Math.floor((rem%3600)/60);
  const remS = rem%60;
  const elH = Math.floor(elapsed/3600);
  const elM = Math.floor((elapsed%3600)/60);
  const elS = elapsed%60;
  const r = 110;
  const circ = 2 * Math.PI * r;

  return (
    <ScrollView style={{flex:1, backgroundColor:C.bg}} contentContainerStyle={{padding:16, paddingBottom:80, alignItems:'center'}} showsVerticalScrollIndicator={false}>
      <Text style={{color:C.text, fontSize:22, fontWeight:'800', marginBottom:20, marginTop:8, alignSelf:'flex-start'}}>Intervallfasten</Text>

      <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:32, width:'100%'}}>
        {FASTING_PRESETS.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => {if(!fastState?.active) setSelPreset(i);}} style={{paddingHorizontal:20, paddingVertical:10, borderRadius:12, backgroundColor:selPreset===i?C.accent:C.card, borderWidth:1, borderColor:selPreset===i?C.accent:C.border}}>
            <Text style={{color:selPreset===i?C.text:C.sub, fontWeight:'700'}}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{width:260, height:260, alignItems:'center', justifyContent:'center', marginBottom:32}}>
        <Svg width={260} height={260}>
          <Circle cx={130} cy={130} r={r} stroke={C.border} strokeWidth={16} fill="none" />
          <Circle cx={130} cy={130} r={r} stroke={fastState?.active ? C.teal : C.accent} strokeWidth={16} fill="none"
            strokeDasharray={String(circ * prog) + ' ' + String(circ)}
            strokeLinecap="round" transform="rotate(-90 130 130)" />
        </Svg>
        <View style={{position:'absolute', alignItems:'center'}}>
          {fastState?.active ? (
            <>
              <Text style={{color:C.sub, fontSize:12}}>Vergangen</Text>
              <Text style={{color:C.text, fontSize:32, fontWeight:'800'}}>{pad(elH)}:{pad(elM)}:{pad(elS)}</Text>
              <Text style={{color:C.sub, fontSize:12, marginTop:4}}>Noch {pad(remH)}:{pad(remM)}:{pad(remS)}</Text>
              {prog >= 1 && <Text style={{color:C.green, fontWeight:'700', fontSize:13, marginTop:4}}>Ziel erreicht!</Text>}
            </>
          ) : (
            <>
              <Text style={{color:C.sub, fontSize:13}}>Fastenzeit</Text>
              <Text style={{color:C.text, fontSize:40, fontWeight:'800'}}>{preset.fast}h</Text>
              <Text style={{color:C.sub, fontSize:12}}>Fenster: {preset.eat}h</Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={[s.btn, {width:200, backgroundColor:fastState?.active?C.red:C.accent}]} onPress={toggleFast}>
        <Ionicons name={fastState?.active?'stop-circle-outline':'play-circle-outline'} size={22} color={C.text} style={{marginRight:8}} />
        <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>{fastState?.active?'Beenden':'Starten'}</Text>
      </TouchableOpacity>

      {!fastState?.active && (
        <View style={[s.card, {width:'100%', padding:16, marginTop:24}]}>
          <Text style={{color:C.text, fontWeight:'700', marginBottom:12}}>Vorteile von {preset.label}</Text>
          {[
            preset.fast+' Stunden fasten',
            preset.eat+' Stunden Essensfenster',
            'Verbesserte Insulinsensitivitaet',
            'Unterstuetzt Fettverbrennung',
          ].map((b, i) => (
            <View key={i} style={{flexDirection:'row', alignItems:'center', paddingVertical:6}}>
              <Ionicons name="checkmark-circle" size={16} color={C.green} style={{marginRight:8}} />
              <Text style={{color:C.sub, fontSize:13}}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({session, onLogout, profile, onEditProfile}) {
  const [weightModal, setWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [weightHist, setWeightHist] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(WEIGHT_KEY).then(v => {if(v) setWeightHist(JSON.parse(v));});
  }, []);

  async function saveWeight() {
    const w = parseFloat(weightInput);
    if (!w) {Alert.alert('Fehler', 'Gueltige Zahl eingeben'); return;}
    const entry = {weight:w, date:todayStr()};
    const updated = [...weightHist, entry].slice(-60);
    setWeightHist(updated);
    await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
    setWeightModal(false);
    setWeightInput('');
  }

  const bmi = profile?.bmi || 0;
  const bmiInfo = getBMIInfo(bmi);
  const tdee = profile?.tdee || 0;
  const cw = profile?.weight || 0;
  const gw = profile?.goalWeight || 0;
  const initW = weightHist.length > 0 ? weightHist[0].weight : cw;
  const wProg = initW && gw && initW !== gw ? Math.min(Math.max((initW - cw) / (initW - gw), 0), 1) : 0;
  const goalObj = GOALS_LIST.find(g => g.id===profile?.goal) || GOALS_LIST[1];
  const actObj = ACTIVITY_LEVELS.find(a => a.id===profile?.activity) || ACTIVITY_LEVELS[1];

  return (
    <ScrollView style={{flex:1, backgroundColor:C.bg}} contentContainerStyle={{padding:16, paddingBottom:80}} showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20, marginTop:8}}>
        <Text style={{color:C.text, fontSize:22, fontWeight:'800'}}>Profil</Text>
        <TouchableOpacity onPress={onEditProfile} style={{flexDirection:'row', alignItems:'center', backgroundColor:C.accent+'22', borderRadius:10, paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:C.accent}}>
          <Ionicons name="create-outline" size={16} color={C.accent} style={{marginRight:6}} />
          <Text style={{color:C.accent, fontWeight:'600', fontSize:13}}>Bearbeiten</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.card, {padding:20, marginBottom:16, alignItems:'center'}]}>
        <View style={{width:72, height:72, borderRadius:36, backgroundColor:C.accent+'33', alignItems:'center', justifyContent:'center', marginBottom:12}}>
          <Ionicons name="person-outline" size={36} color={C.accent} />
        </View>
        <Text style={{color:C.text, fontSize:18, fontWeight:'800', marginBottom:4}}>{session?.user?.email?.split('@')[0] || 'Nutzer'}</Text>
        <Text style={{color:C.sub, fontSize:13}}>{session?.user?.email}</Text>
        {profile && (
          <View style={{flexDirection:'row', gap:16, marginTop:12}}>
            <View style={{alignItems:'center'}}>
              <Text style={{color:C.text, fontWeight:'700'}}>{profile.height} cm</Text>
              <Text style={{color:C.sub, fontSize:11}}>Groesse</Text>
            </View>
            <View style={{width:1, backgroundColor:C.border}} />
            <View style={{alignItems:'center'}}>
              <Text style={{color:C.text, fontWeight:'700'}}>{profile.weight} kg</Text>
              <Text style={{color:C.sub, fontSize:11}}>Gewicht</Text>
            </View>
            <View style={{width:1, backgroundColor:C.border}} />
            <View style={{alignItems:'center'}}>
              <Text style={{color:goalObj.color, fontWeight:'700'}}>{goalObj.label}</Text>
              <Text style={{color:C.sub, fontSize:11}}>Ziel</Text>
            </View>
          </View>
        )}
      </View>

      {bmi > 0 && (
        <View style={[s.card, {padding:20, marginBottom:16}]}>
          <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <Text style={{color:C.text, fontWeight:'700', fontSize:16}}>BMI</Text>
            <View style={{backgroundColor:bmiInfo.color+'22', borderRadius:8, paddingHorizontal:12, paddingVertical:4}}>
              <Text style={{color:bmiInfo.color, fontWeight:'700'}}>{bmiInfo.label}</Text>
            </View>
          </View>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
            <Text style={{color:C.text, fontSize:36, fontWeight:'800', marginRight:8}}>{bmi}</Text>
            <Text style={{color:C.sub}}>BMI</Text>
          </View>
          <View style={{height:8, backgroundColor:C.border, borderRadius:4, overflow:'hidden', flexDirection:'row'}}>
            <View style={{flex:1, backgroundColor:C.blue+'66'}} />
            <View style={{flex:1, backgroundColor:C.green+'66'}} />
            <View style={{flex:1, backgroundColor:C.gold+'66'}} />
            <View style={{flex:1, backgroundColor:C.red+'66'}} />
          </View>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:4}}>
            <Text style={{color:C.blue, fontSize:10}}>Unter</Text>
            <Text style={{color:C.green, fontSize:10}}>Normal</Text>
            <Text style={{color:C.gold, fontSize:10}}>Ueber</Text>
            <Text style={{color:C.red, fontSize:10}}>Adipositas</Text>
          </View>
        </View>
      )}

      {tdee > 0 && (
        <View style={[s.card, {padding:20, marginBottom:16}]}>
          <Text style={{color:C.text, fontWeight:'700', fontSize:16, marginBottom:12}}>Tageskalorien (TDEE)</Text>
          <Text style={{color:C.accent, fontSize:36, fontWeight:'800', marginBottom:12}}>
            {tdee} <Text style={{fontSize:16, color:C.sub}}>kcal</Text>
          </Text>
          {profile && (
            <View>
              {[
                {l:'Grundumsatz (BMR)', v:Math.round(tdee / actObj.factor)},
                {l:'Aktivitaetsfaktor', v:'x'+actObj.factor},
                {l:'Zielanpassung', v:(goalObj.adj > 0 ? '+' : '')+goalObj.adj+' kcal'},
              ].map((row, i) => (
                <View key={i} style={{flexDirection:'row', justifyContent:'space-between', paddingVertical:6, borderBottomWidth:i<2?1:0, borderBottomColor:C.border}}>
                  <Text style={{color:C.sub, fontSize:13}}>{row.l}</Text>
                  <Text style={{color:C.text, fontSize:13, fontWeight:'600'}}>{row.v}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {cw > 0 && gw > 0 && (
        <View style={[s.card, {padding:20, marginBottom:16}]}>
          <Text style={{color:C.text, fontWeight:'700', fontSize:16, marginBottom:12}}>Gewichtsfortschritt</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
            <View>
              <Text style={{color:C.sub, fontSize:11}}>Aktuell</Text>
              <Text style={{color:C.text, fontWeight:'700', fontSize:18}}>{cw} kg</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={{color:C.sub, fontSize:11}}>Ziel</Text>
              <Text style={{color:goalObj.color, fontWeight:'700', fontSize:18}}>{gw} kg</Text>
            </View>
          </View>
          <View style={{height:10, backgroundColor:C.border, borderRadius:5, overflow:'hidden'}}>
            <View style={{height:'100%', width:`${wProg*100}%`, backgroundColor:goalObj.color, borderRadius:5}} />
          </View>
          <Text style={{color:C.sub, fontSize:12, marginTop:6, textAlign:'center'}}>{Math.round(wProg*100)}% des Ziels erreicht</Text>
        </View>
      )}

      <View style={[s.card, {padding:16, marginBottom:16}]}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <Text style={{color:C.text, fontWeight:'700'}}>Gewichtsverlauf</Text>
          <TouchableOpacity onPress={() => setWeightModal(true)} style={{backgroundColor:C.accent, borderRadius:8, paddingHorizontal:12, paddingVertical:6}}>
            <Text style={{color:C.text, fontSize:12, fontWeight:'600'}}>Eintragen</Text>
          </TouchableOpacity>
        </View>
        {weightHist.length === 0 ? (
          <Text style={{color:C.sub, textAlign:'center', paddingVertical:16}}>Noch keine Eintraege</Text>
        ) : (
          weightHist.slice(-7).reverse().map((w, i) => (
            <View key={i} style={{flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:i<Math.min(weightHist.length,7)-1?1:0, borderBottomColor:C.border}}>
              <Text style={{color:C.sub, fontSize:13}}>{w.date}</Text>
              <Text style={{color:C.text, fontWeight:'600'}}>{w.weight} kg</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={[s.btn, {backgroundColor:C.card, borderWidth:1, borderColor:C.red}]} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color={C.red} style={{marginRight:8}} />
        <Text style={{color:C.red, fontWeight:'700'}}>Abmelden</Text>
      </TouchableOpacity>

      <Modal visible={weightModal} transparent animationType="fade" onRequestClose={() => setWeightModal(false)}>
        <View style={{flex:1, backgroundColor:'#000000BB', justifyContent:'center', alignItems:'center', padding:24}}>
          <View style={{backgroundColor:C.card, borderRadius:20, padding:24, width:'100%'}}>
            <Text style={{color:C.text, fontSize:18, fontWeight:'800', marginBottom:16}}>Gewicht eintragen</Text>
            <TextInput style={s.input} value={weightInput} onChangeText={setWeightInput} keyboardType="numeric" placeholder="z.B. 75.5" placeholderTextColor={C.sub} />
            <View style={{flexDirection:'row', gap:12, marginTop:16}}>
              <TouchableOpacity style={[s.btn, {flex:1, backgroundColor:C.card2}]} onPress={() => setWeightModal(false)}>
                <Text style={{color:C.text, fontWeight:'600'}}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, {flex:1, backgroundColor:C.accent}]} onPress={saveWeight}>
                <Text style={{color:C.text, fontWeight:'700'}}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [diary, setDiary] = useState({});
  const [water, setWaterState] = useState({});
  const [fastState, setFastStateRaw] = useState(null);
  const [workouts, setWorkoutsState] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({data: {session: s}}) => {
      setSession(s);
      if (s) loadData(s);
      else setLoading(false);
    });
    const {data: {subscription}} = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (s) loadData(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadData(s) {
    try {
      const [dv, wv, fv, pv, wkv] = await Promise.all([
        AsyncStorage.getItem(DIARY_KEY),
        AsyncStorage.getItem(WATER_KEY),
        AsyncStorage.getItem(FAST_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(WORKOUT_KEY),
      ]);
      if (dv) setDiary(JSON.parse(dv));
      if (wv) setWaterState(JSON.parse(wv));
      if (fv) setFastStateRaw(JSON.parse(fv));
      if (wkv) setWorkoutsState(JSON.parse(wkv));
      if (pv) {
        setProfile(JSON.parse(pv));
        setShowOnboarding(false);
      } else {
        setShowOnboarding(true);
      }
    } catch(e) {
      console.warn('loadData error:', e);
    }
    setLoading(false);
  }

  async function addEntry(entry) {
    const d = entry.date || todayStr();
    const updated = {...diary, [d]: [...(diary[d]||[]), entry]};
    setDiary(updated);
    await AsyncStorage.setItem(DIARY_KEY, JSON.stringify(updated));
  }

  async function setWater(glasses) {
    const today = todayStr();
    const updated = {...water, [today]: Math.max(0, glasses)};
    setWaterState(updated);
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(updated));
  }

  async function setFastState(st) {
    setFastStateRaw(st);
    if (st) await AsyncStorage.setItem(FAST_KEY, JSON.stringify(st));
    else await AsyncStorage.removeItem(FAST_KEY);
  }

  async function setWorkouts(wk) {
    setWorkoutsState(wk);
    await AsyncStorage.setItem(WORKOUT_KEY, JSON.stringify(wk));
  }

  async function handleOnboardingComplete(p) {
    setProfile(p);
    setShowOnboarding(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setDiary({});
    setWaterState({});
    setFastStateRaw(null);
    setWorkoutsState({});
  }

  if (loading) {
    return (
      <View style={{flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center'}}>
        <Ionicons name="nutrition-outline" size={48} color={C.accent} />
        <ActivityIndicator color={C.accent} style={{marginTop:16}} />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen onAuth={s => {setSession(s); loadData(s);}} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const TABS = [
    {id:'home', label:'Home', icon:'home-outline', iconA:'home'},
    {id:'scan', label:'Scan', icon:'add-circle-outline', iconA:'add-circle'},
    {id:'verlauf', label:'Verlauf', icon:'bar-chart-outline', iconA:'bar-chart'},
    {id:'fasten', label:'Fasten', icon:'timer-outline', iconA:'timer'},
    {id:'profil', label:'Profil', icon:'person-outline', iconA:'person'},
  ];

  function renderScreen() {
    switch(activeTab) {
      case 'home':    return <HomeScreen diary={diary} water={water} setWater={setWater} profile={profile} workouts={workouts} />;
      case 'scan':    return <ScanScreen onAdd={addEntry} />;
      case 'verlauf': return <VerlaufScreen diary={diary} workouts={workouts} setWorkouts={setWorkouts} profile={profile} />;
      case 'fasten':  return <FastenScreen fastState={fastState} setFastState={setFastState} />;
      case 'profil':  return <ProfileScreen session={session} onLogout={logout} profile={profile} onEditProfile={() => setShowOnboarding(true)} />;
      default:        return null;
    }
  }

  return (
    <View style={[s.fill, {backgroundColor:C.bg}]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <SafeAreaView style={s.fill}>
        <View style={s.fill}>
          {renderScreen()}
        </View>
        <View style={{flexDirection:'row', backgroundColor:C.card, borderTopWidth:1, borderTopColor:C.border, paddingBottom:Platform.OS==='ios'?16:4}}>
          {TABS.map(t => {
            const active = activeTab === t.id;
            const isCenter = t.id === 'scan';
            return (
              <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={{flex:1, alignItems:'center', paddingTop:isCenter?0:8}}>
                {isCenter ? (
                  <View style={{width:52, height:52, borderRadius:26, backgroundColor:C.accent, alignItems:'center', justifyContent:'center', marginTop:-16, elevation:4}}>
                    <Ionicons name={active?t.iconA:t.icon} size={24} color={C.text} />
                  </View>
                ) : (
                  <>
                    <Ionicons name={active?t.iconA:t.icon} size={22} color={active?C.accent:C.sub} />
                    <Text style={{color:active?C.accent:C.sub, fontSize:10, marginTop:2, fontWeight:active?'700':'400'}}>{t.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: {flex:1},
  card: {backgroundColor:C.card, borderRadius:16, borderWidth:1, borderColor:C.border},
  btn: {flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:14, paddingHorizontal:20, borderRadius:14},
  input: {backgroundColor:C.card2, borderWidth:1, borderColor:C.border, borderRadius:12, paddingHorizontal:16, paddingVertical:12, color:C.text, fontSize:15},
  h1: {color:C.text, fontSize:26, fontWeight:'800', marginBottom:4},
  sub2: {color:C.sub, fontSize:14},
});
