import { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, fire } from "../Firebase";
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

export default function Home() {
    const [img, setImg] = useState("");
    const [file, setFile] = useState("");

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(fire, "files"), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    setFile((prevFiles) => [...prevFiles, change.doc.data()]);
                }
            });
        });
        return () => unsubscribe();
    }, []);

    async function uploadImage(uri, fileType) {
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, "images/" + fileType);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
            "state_changed",
            () => {
                if (uploadTask && uploadTask.snapshot) {
                    getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                        await saveRecord(fileType, downloadURL, new Date().toISOString());
                        setImg("");
                    });
                }
            }
        );
    }

    async function saveRecord(fileType, url, createdAt) {
        try {
            const docRef = await addDoc(collection(fire, "files"), {
                fileType,
                url,
                createdAt,
            });
        } catch (e) {
            console.log(e);
        }
    }

    async function pickImage() {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.cancelled) {
            setImg(result.assets[0].uri);
            await uploadImage(result.assets[0].uri, "image");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.texto}>Imagens</Text>
            <FlatList
                data={file}
                keyExtractor={(item) => item.url}
                renderItem={({item}) => {
                    if (item.fileType === "image") {
                        return (
                            <Image
                                source={{uri: item.url}}
                                style={styles.images}
                            />
                        );
                    }
                }}
                numColumns={2}
            />
            <TouchableOpacity
                onPress={pickImage}
                style={styles.botao}
            >
                <Text style={styles.btn}>
                    Selecionar Imagem
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    texto: {
        textAlign: 'center',
        marginTop: 150,
        color: '#000'
    },
    images: {
        width: 300,
        height: 300,
    },
    btn: {
        textAlign: 'center',
        color: '#fff'
    },
    botao: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        backgroundColor: 'purple',
        width: 150,
        height: 50,
        bottom: 50,
        marginTop: 50
    }
});
