import {useEffect, useState} from 'react';
import {View, Image, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import {getDownloadURL, ref, uploadBytesResumable} from "fisebase/storage";
import {storage, fire} from "../Firebase"
import { onSnapshot } from 'firebase/firestore';

export default function Home(){
    const[img, setImg] = useState("");
    const[file, setFile] = useState("");

    useEffect (()=>{
        const unsubscribe = onSnapshot(collection(fire, "files"),(snaphot)=>{
            snaphot.docChanges().forEach((change)=>{
                if(change.type === "added"){
                    setFile((prevFiles)=> [...prevFiles, change.doc.data()]);
                }
            });
    });
    return () => unsubscribe();
}, []);

async function uploadImage(uri, fileType){
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, "");
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
        "state_changed",
        ()=>{
            getDownloadURL(uploadTask.snaphot.ref).then(async (downloadURL) =>{
                await saveRecord(fileType, downloadURL, new Date().toISOString());
                setImg("");
            });
        }
    )
}

async function saveRecord(fileType, url, createdAt){
    try{
        const docRef = await addDoc(collection,(fire, "files"),{
            fileType,
            url,
            createdAt,
        })
    }catch(e){
        console.log(e);
    }
}

return (
    <View>
        <Text>Minhas Fotos Lindas</Text>
        <FlatList
        data={file}
        keyExtractor={(item)=>item.url}
        renderItem={({item}) => {
            if(item.fileType === "img"){
                return (
                    <Image
                    source={{uri:item.url}}
                    style={estilo.fotos}
                    />
                )
            }            
        }
        }
        numColumns={2}
        
        />

    </View>
)

}