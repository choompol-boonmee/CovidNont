import React, { useState, useEffect } from 'react';
import { 
StyleSheet, Text, View, ImageBackground, TextInput, Button
, TouchableOpacity} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as SQLite from 'expo-sqlite';
import RadioGroup from 'react-native-radio-button-group';

const db = SQLite.openDatabase("CovidNont.db");

const initDb = (tx) => {
  console.log("INIT DB..3");
  tx.executeSql('drop table if exists covinfo');
  tx.executeSql('create table if not exists covinfo(id char(13), name varchar(80), phone varchar(15), fever numeric(6,2), staff char(1))');
  tx.executeSql("insert into covinfo(id,name,phone,fever,staff) values('','','','','')");
};

const App = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [pid, setPid] = useState('?');
  const [pname, setPname] = useState('?');
  const [pfever, setPfever] = useState('N');
  const [pstaff, setPstaff] = useState('N');
  const [phone, setPhone] = useState('?');
  const [mode, setMode] = useState(1);
  const [wrongId, setWrongId] = useState(false);
  const [wrongName, setWrongName] = useState(false);
  const [wrongPhone, setWrongPhone] = useState(false);
  const [wrongFever, setWrongFever] = useState(false);
  const [wrongStaff, setWrongStaff] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    db.transaction(tx => {
      tx.executeSql("select id,name,phone,fever,staff from covinfo"
        , [], (tx,rs)=>{
          console.log("DB:", rs.rows.item(0).id, rs.rows.item(0).name, rs.rows.item(0).phone, rs.rows.item(0).fever, rs.rows.item(0).staff);
          setPid(rs.rows.item(0).id);
          setPname(rs.rows.item(0).name);
          setPhone(rs.rows.item(0).phone);
          setPfever(rs.rows.item(0).fever);
          setPstaff(rs.rows.item(0).staff);
        }, (er)=> { initDb(tx); })
    });
  },[]);
  useEffect(() => {
    // validate ID
    let wId = false;
    if(pid.length!=13) {
      wId = true;
    } else {
      let sum=0,i=0;
      for(; i < 12; i++)
        sum += parseFloat(pid.charAt(i))*(13-i);
      let cdg = (11-sum%11)%10;
      if((11-sum%11)%10!=parseFloat(pid.charAt(12)))
        wId = true;
    }
    setWrongId(wId);

    let wNm = false;
    if(pname==='' || pname.length==0) wNm = true;
    setWrongName(wNm);

console.log("DATA: ", pid, pname, phone, pfever, pstaff);
    let wPh = false;
    if(phone==='' || phone.length<5) wPh = true;
    setWrongPhone(wPh);

    let wFv = true;
    if(pfever=='1' || pfever=='2') wFv = false;
    setWrongFever(wFv);

    let wSt = true;
    if(pstaff=='1' || pstaff=='2') wSt = false;
    setWrongStaff(wSt);

console.log("WRG: ", wId, wNm, wPh, wFv, wSt);

    if(!wId && !wNm && !wPh && !wFv && !wSt) {
      console.log("SAVE DATA", pid, pname, pfever, pstaff);
      db.transaction(tx => {tx.executeSql(
        "update covinfo set id=?,name=?,phone=?,fever=?,staff=?", [pid, pname, phone, pfever, pstaff]
       ,(tx,rs)=>{ 
         //console.log("SET ID2: ",rs.rowsAffected);
       });});
     }
  },[pid,pname,phone,pfever,pstaff]);

  let fgSnd = 0;

  const handleBarCodeScanned = async ({ type, data }) => {
    if(!data.startsWith("covnon:")) return;
    if(fgSnd>0) return;
    fgSnd++;
    let u0 = "http://203.157.104.141/covidscan/mod_token/mod_server_temp.php";
    u0 = "https://ssjnonthaburi.moph.go.th/covidscan/mod_token/mod_server_temp.php";
    //u0 = "https://moc.toshare.info/covid_monitor.php";
    //u0 = "http://203.157.104.141/covid/mod_server_temp.php";
    
    let cd = "d0aaaa111ab3e4558e59aadf2913fa87b6618982e42d167b07691a50cccc5a27";
    let sv = "3100601641284";
    let nm = "นายชุมพล บุญมี";
    let ph = "0879581794";
    let tp = "1";
    let fe = "N";
    cd = data;
    sv = pid;
    nm = pname;
    ph = phone;
    tp = pstaff;
    fe = pfever;

    if(pstaff=='1') tp = '1';
    else tp = '2';
    if(pfever=='1') fe = 'Y';
    else fe = 'N';

    let url = u0 + "?COMPANYCODE=" + cd + "&SERVANTID="+ sv + "&NAME="+ nm
       + "&PHONE="+ ph + "&TYPE=" + tp + "&TEMP="+ fe;
    //url = u0;
    fetch(url, { method: 'GET', }) 
    .then((resp) => {
      fgSnd = 0;
      return resp.text(); 
    })
    .then((text) => {
      fgSnd = 0;
      setMode(2);
      setTimeout(()=>setMode(1), 2000);
    })
    .catch((err) => {
      fgSnd = 0;
      console.log("ERROR", err);
    });
  }

  const optFever = [
    {
      id: '1',
      value: '1',
      label: 'มีไข้',
    },
    {
      id: '2',
      value: '2',
      label: 'ไม่มีไข้',
    }
  ];
  const optStaff = [
    {
      id: '1',
      value: '1',
      label: 'ผู้ให้บริการ',
    },
    {
      id: '2',
      value: '2',
      label: 'ผู้รับบริการ',
    }
  ];

  if (hasPermission === null) { return <Text>ขอใช้กล้องเพื่อสแกนคิวอาร์โค้ด</Text>; }
  if (hasPermission === false) { return <Text>ไม่สามารถใช้กล้องเพื่อสแกนคิวอาร์โค้ด</Text>; }
  return (
    <ImageBackground style={styles.imgBackground}
      source={require("./assets/covid-blue.jpg")}>
      {mode===1 && <View style={{}}>

        {(!wrongId && !wrongName && !wrongPhone && !wrongFever && !wrongStaff) &&
        <TouchableOpacity onPress={()=>{ fgSnd=0; setMode(3); 
            setTimeout(()=>setMode(1), 10000);
          }}> 
          <Text style={{fontSize:24, backgroundColor: 'darkgreen'
            , paddingLeft:10, marginBottom: 20 , color: 'white'}}>
            สแกนคิวอาร์โค้ด</Text>
        </TouchableOpacity>}

        <Text style={{fontSize: 14, color: 'yellow'}}> เลขประจำตัวประชาชน</Text>
        <TextInput  
          style={ {fontSize: 20, backgroundColor: 'white', color: 'black'}}
          placeholder = "เลขประจำตัว"
          placeholderTextColor = "#9a73ef"
          autoCapitalize="none" autoCorrect={false}
          onChangeText={(v) => { setPid(v); }} value={pid}/>

        <Text style={{fontSize: 14, color: 'yellow'}}>ชื่อ-นามสกุล</Text>
        <TextInput
          style={ {fontSize: 20, backgroundColor: 'white', color: 'black'}}
          autoCapitalize="none" autoCorrect={false}
          onChangeText={(v) => { setPname(v); }} value={pname}/>

        <Text style={{fontSize: 14, color: 'yellow'}}>โทรศัพท์</Text>
        <TextInput
          style={ {fontSize: 20, backgroundColor: 'white', color: 'black'}}
          autoCapitalize="none" autoCorrect={false}
          onChangeText={(v) => { setPhone(v); }} value={phone}/>

        <View style={{backgroundColor:'white'
          , marginTop:30, paddingTop:10, paddingLeft:10}}>
          <RadioGroup style={{ fontSize:20, color: 'white' }}
            onChange={(v)=>{setPstaff(v.id); console.log("St:",v.id);}}
            horizontal 
            options={optStaff} 
          />
        </View>

        <View style={{backgroundColor:'white'
          , marginTop:30, paddingTop:10, paddingLeft:10}}>
          <RadioGroup style={{ fontSize:20, color: 'white' }}
            onChange={(v)=>{setPfever(v.id); console.log("FVER:",v.id);}}
            horizontal 
            options={optFever} 
          />
        </View>

      </View>}
      {mode==2 && 
        <View style={styles.succmsg}>
         <Text style={styles.succmsg}></Text>
         <Text style={styles.succmsg}>ส่งข้อมูลเสร็จแล้ว</Text>
        </View>
      }
      {mode==3 &&
        <View style={styles.scan}>
          <BarCodeScanner
            onBarCodeScanned = {handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject} /> 
          <Button style={{marginTop:200}}
            title='ยกเลิก' onPress={()=>{ fgSnd=0; setMode(1);}}/>
        </View>
      }
    </ImageBackground>
  );
}

export default App;

const styles = StyleSheet.create({
  contain: {
     paddingTop: 100
  },
  scan: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  imgBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 20,
    color: 'yellow',
    borderWidth: 1,
  },
  text: {
    fontSize: 20,
    color: 'white',
  },
  succmsg: {
    flex: 1,
    fontSize: 22,
    color: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: 18,
    color: 'red',
  },
});

