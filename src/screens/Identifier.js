import React, { useState, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// const HUGGING_FACE_API_KEY = "";
// const API_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50";

export default function Identifier() {
    const [facing, setFacing] = useState('back');
    const [photoUri, setPhotoUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [wasteType, setWasteType] = useState('');
    const [disposal, setDisposal] = useState('');

    const cameraRef = useRef(null);

    const toggleCameraFacing = () => setFacing((current) => (current === 'back' ? 'front' : 'back'));

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ base64: true });
                setPhotoUri(photo.uri);
                setLoading(true);
                analyzeImage(photo.base64);
            } catch (error) {
                console.error('Error taking picture:', error);
                Alert.alert('Error', 'Failed to take picture.');
            }
        }
    };

    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true,
            });

            if (!result.canceled) {
                setPhotoUri(result.assets[0].uri);
                setLoading(true);
                analyzeImage(result.assets[0].base64);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image.');
        }
    };

    
    const wasteCategoryMap = {
        "pop bottle, soda bottle": "plastic",
        "water bottle": "plastic",
        "beer glass": "glass",
        "soap dispenser": "plastic",
        "newspaper": "paper",
        "laptop": "e-waste",
        "battery": "e-waste",
        "food scraps": "food",
        "apple core": "food",
        "plastic bag": "plastic",
        "aluminum can": "metal",
        "cardboard box": "paper"
    };
    
    const analyzeImage = async (base64) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: base64 }),
            });
    
            const result = await response.json();
            console.log("API Response:", result);  
    
            if (!Array.isArray(result) || result.length === 0) {
                Alert.alert('No Waste Detected', 'The image does not contain identifiable waste.');
                setLoading(false);
                return;
            }
    
            console.log("Detected Labels:", result.map(item => `${item.label} (${item.score})`));
    
            let bestMatch = null;
    
            for (const item of result) {
                const label = item.label.toLowerCase();
                const confidence = item.score;
    
                console.log(`Checking: ${label} - Confidence: ${confidence}`);
    
                if (confidence >= 0.20) {  // Adjusted threshold for better detection
                    const mappedCategory = wasteCategoryMap[label] || null;
    
                    if (mappedCategory) {
                        bestMatch = { label: mappedCategory, confidence };
                        break;
                    }
                }
            }
    
            if (bestMatch) {
                setWasteType(bestMatch.label);
                setDisposal(getDisposalInstructions(bestMatch.label));
                Alert.alert('Waste Identified', `Type: ${bestMatch.label}\nDisposal: ${getDisposalInstructions(bestMatch.label)}`);
            } else {
                Alert.alert('No Waste Detected', 'Try a different angle or better lighting.');
            }
    
            setLoading(false);
        } catch (error) {
            console.error('Image Analysis Error:', error);
            Alert.alert('Error', 'Failed to analyze the image.');
            setLoading(false);
        }
    };
    

    const getDisposalInstructions = (material) => {
        const disposalMethods = {
            plastic: 'Recycle in plastic bins.',
            metal: 'Recycle in metal bins.',
            glass: 'Recycle in glass bins.',
            paper: 'Recycle in paper bins.',
            'e-waste': 'Dispose of at e-waste collection centers.',
            food: 'Compost or dispose of in food waste bins.',
            chemicals: 'Follow hazardous waste disposal guidelines.',
            textiles: 'Donate or recycle textiles.',
        };
        return disposalMethods[material] || 'Dispose of according to local regulations.';
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} facing={facing}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                        <MaterialIcons name="flip-camera-ios" size={40} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={takePicture}>
                        <Ionicons name="camera-outline" size={40} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                        <Ionicons name="images-outline" size={35} color="white" />
                    </TouchableOpacity>
                </View>
            </CameraView>
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, width: '100%' },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, position: 'absolute', bottom: 30, width: '100%' },
    iconButton: { alignItems: 'center', flex: 1 },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
});













// import React, { useState } from 'react';
// import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Image, Alert, Modal } from 'react-native';
// import { CameraView, useCameraPermissions } from 'expo-camera';
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { GEMINI_API_KEY } from '@env';
// import { MaterialIcons, Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
// import { collection, addDoc } from '../../firebaseConfig';

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// export default function Identifier({ navigation }) {
//     const [facing, setFacing] = useState('back');
//     const [permission, requestPermission] = useCameraPermissions();
//     const [photoUri, setPhotoUri] = useState(null);
//     const [response, setResponse] = useState('');
//     const [modalVisible, setModalVisible] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [materialType, setMaterialType] = useState('');
//     const [disposal, setDisposal] = useState('');
//     const [name, setName] = useState('');

//     if (!permission) {
//         // Camera permissions are still loading
//         return <View />;
//     }

//     if (!permission.granted) {
//         // Camera permissions are not granted yet
//         return (
//             <View style={styles.container}>
//                 <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
//                 <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
//                     <Text style={styles.buttonText}>Grant Permission</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     }

//     const toggleCameraFacing = () => {
//         setFacing(current => (current === 'back' ? 'front' : 'back'));
//     };

//     const takePicture = async () => {
//         if (cameraRef) {
//             try {
//                 const photo = await cameraRef.takePictureAsync({ base64: true });
//                 setPhotoUri(photo.uri);
//                 setLoading(true);
//                 analyzeImage(photo.base64);
//             } catch (error) {
//                 console.error('Failed to take picture:', error);
//                 Alert.alert('Error', 'Failed to take picture');
//             }
//         }
//     };

//     const pickImage = async () => {
//         try {
//             let result = await ImagePicker.launchImageLibraryAsync({
//                 mediaTypes: ImagePicker.MediaTypeOptions.All,
//                 allowsEditing: true,
//                 aspect: [4, 3],
//                 quality: 1,
//                 base64: true,
//             });

//             if (!result.cancelled) {
//                 setPhotoUri(result.assets[0].uri);
//                 setLoading(true);
//                 analyzeImage(result.assets[0].base64);
//             }
//         } catch (error) {
//             console.error('Failed to pick image:', error);
//             Alert.alert('Error', 'Failed to pick image');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const analyzeImage = async (base64) => {
//         const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
//         const prompt = "Provide valid JSON output. Given these categories: E-waste, Food, Chemicals, Textiles, Metal, Plastic, classify the object in the image. Provide one column name 'name' which is the name of the object. Provide one column name 'material_type' which is the type of material of the object. Provide another column name 'disposal' which is the instructions on how to properly dispose of the material. Make the instructions limited to 50 words.";
    
//         const imageParts = [
//             {
//                 inlineData: {
//                     data: base64,
//                     mimeType: "image/jpeg"
//                 }
//             }
//         ];
    
//         try {
//             const result = await model.generateContent([prompt, ...imageParts]);
//             const response = result.response;
//             console.log('Gemini API Response:', response.text());
    
//             const jsonResponse = JSON.parse(response.text());
//             const { name, material_type, disposal } = jsonResponse;
    
//             setName(name);
//             setMaterialType(material_type);
//             setDisposal(disposal);
//             saveScannedItem(material_type, disposal, name);
//             setLoading(false);
//             setModalVisible(true);
//         } catch (error) {
//             console.error('Failed to analyze image:', error);
//             Alert.alert('Error', 'Failed to analyze image');
//             setLoading(false);
//         }
//     };

//     const saveScannedItem = async (materialType, disposal, name) => {
//         const user = FIREBASE_AUTH.currentUser;
//         if (user) {
//             try {
//                 await addDoc(collection(FIRESTORE_DB, 'scannedItems'), {
//                     userId: user.uid,
//                     materialType: materialType,
//                     disposal: disposal,
//                     name: name,
//                     timestamp: new Date(),
//                 });
//                 console.log('Scanned item saved to Firestore');
//             } catch (error) {
//                 console.error('Failed to save scanned item:', error);
//             }
//         }
//     };

//     const getBinTypeForItem = (itemType) => {
//         switch (itemType.toLowerCase()) {
//             case 'plastic':
//                 return 'General Recyclables';
//             case 'paper':
//                 return 'General Recyclables';
//             case 'metal':
//                 return 'General Recyclables';
//             case 'glass':
//                 return 'General Recyclables';
//             case 'e-waste':
//                 return 'E-waste';
//             default:
//                 return null;
//         }
//     };

//     const navigateToMapScreen = () => {
//         const binType = getBinTypeForItem(materialType);
      
//         console.log(binType);
//         if (binType) {
//             setModalVisible(false);
//             navigation.navigate('Map', { binType, itemScanned: true });
//         } else {
//             Alert.alert('Error', 'No bin type found for the item');
//         }
//     };

//     let cameraRef;

//     return (
//         <View style={styles.container}>
//             <CameraView
//                 style={styles.camera}
//                 ref={ref => {
//                     cameraRef = ref;
//                 }}
//                 facing={facing}
//             >
//                 <View style={styles.buttonContainer}>
//                     <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
//                         <MaterialIcons name="flip-camera-ios" size={40} color="white" />
//                     </TouchableOpacity>
//                     <TouchableOpacity style={styles.iconButton} onPress={takePicture}>
//                         <Ionicons name="camera-outline" size={40} color="white" />
//                     </TouchableOpacity>
//                     <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
//                         <Ionicons name="images-outline" size={35} color="white" />
//                     </TouchableOpacity>
//                 </View>
//             </CameraView>
//             {loading && (
//                 <View style={styles.loadingContainer}>
//                     <ActivityIndicator size="large" color="#0000ff" />
//                 </View>
//             )}
//             <Modal
//                 animationType="slide"
//                 transparent={true}
//                 visible={modalVisible}
//                 onRequestClose={() => {
//                     setModalVisible(!modalVisible);
//                 }}
//             >
//                 <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
//                     <View style={styles.modalContent}>
//                         <Image source={{ uri: photoUri }} style={{ width: 300, height: 300 }} />
//                         <Text style={{ marginTop: 20, textAlign: 'center' }}>Name: {name}</Text>
//                         <Text style={{ marginTop: 20, textAlign: 'center' }}>Material Type: {materialType}</Text>
//                         <Text style={{ marginTop: 20, textAlign: 'center' }}>Disposal: {disposal}</Text>
//                         <TouchableOpacity
//                             style={styles.navigateButton}
//                             onPress={() => {
//                                 setModalVisible(false);
//                                 navigateToMapScreen();
//                             }}
//                         >
//                             <Text style={styles.buttonText}>Navigate</Text>
//                         </TouchableOpacity>
//                     </View>
//                 </TouchableOpacity>
//             </Modal>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     camera: {
//         flex: 1,
//         width: '100%',
//     },
//     buttonContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 50,
//         paddingBottom: 20,
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//     },
//     iconButton: {
//         alignItems: 'center',
//         flex: 1,
//     },
//     text: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: 'white',
//     },
//     modalContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     },
//     modalContent: {
//         width: '80%',
//         backgroundColor: 'white',
//         borderRadius: 10,
//         padding: 20,
//         alignItems: 'center',
//     },
//     navigateButton: {
//         marginTop: 20,
//         padding: 10,
//         backgroundColor: '#007BFF',
//         borderRadius: 5,
//     },
//     buttonText: {
//         color: 'white',
//         fontWeight: 'bold',
//     },
//     permissionButton: {
//         padding: 10,
//         backgroundColor: '#007BFF',
//         borderRadius: 5,
//         marginTop: 20,
//     },
//     loadingContainer: {
//         ...StyleSheet.absoluteFillObject,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     },
// });

