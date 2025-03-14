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
        "notebook, notebook computer": "e-waste",
        "battery": "e-waste",
        "food scraps": "food",
        "apple core": "food",
        "plastic bag": "plastic",
        "aluminum can": "metal",
        "cardboard box": "paper",
        "carton": "paper",
        "trash can": "plastic",
        "garbage can": "plastic",
        "wastebin": "plastic",
        "ashcan": "plastic",
        "dustbin": "plastic",
        "trash barrel": "plastic",
        "trash bin": "plastic"
    };

    // const analyzeImage = async (base64) => {
    //     try {
    //         const response = await fetch(API_URL, {
    //             method: 'POST',
    //             headers: {
    //                 Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ inputs: base64 }),
    //         });

    //         const result = await response.json();
    //         console.log("API Response:", result);

    //         if (!Array.isArray(result) || result.length === 0) {
    //             Alert.alert('No Waste Detected', 'The image does not contain identifiable waste.');
    //             setLoading(false);
    //             return;
    //         }

    //         console.log("Detected Labels:", result.map(item => `${item.label} (${item.score})`));

    //         let bestMatch = null;

    //         for (const item of result) {
    //             const label = item.label.toLowerCase();
    //             const confidence = item.score;

    //             console.log(`Checking: ${label} - Confidence: ${confidence}`);

    //             if (confidence >= 0.20) {  // Adjusted threshold for better detection
    //                 const mappedCategory = wasteCategoryMap[label] || null;

    //                 if (mappedCategory) {
    //                     bestMatch = { label: mappedCategory, confidence };
    //                     break;
    //                 }
    //             }
    //         }

    //         if (bestMatch) {
    //             setWasteType(bestMatch.label);
    //             setDisposal(getDisposalInstructions(bestMatch.label));
    //             Alert.alert('Waste Identified', `Type: ${bestMatch.label}\nDisposal: ${getDisposalInstructions(bestMatch.label)}`);
    //         } else {
    //             Alert.alert('No Waste Detected', 'Try a different angle or better lighting.');
    //         }

    //         setLoading(false);
    //     } catch (error) {
    //         console.error('Image Analysis Error:', error);
    //         Alert.alert('Error', 'Failed to analyze the image.');
    //         setLoading(false);
    //     }
    // };

    // const getDisposalInstructions = (material) => {
    //     const disposalMethods = {
    //         plastic: 'Recycle in plastic bins.',
    //         metal: 'Recycle in metal bins.',
    //         glass: 'Recycle in glass bins.',
    //         paper: 'Recycle in paper bins.',
    //         'e-waste': 'Dispose of at e-waste collection centers.',
    //         food: 'Compost or dispose of in food waste bins.',
    //         chemicals: 'Follow hazardous waste disposal guidelines.',
    //         textiles: 'Donate or recycle textiles.',
    //     };
    //     return disposalMethods[material] || 'Dispose of according to local regulations.';
    // };

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
            const CONFIDENCE_THRESHOLD = 0.05; // 5% threshold for normal cases
            const HIGH_CONFIDENCE_THRESHOLD = 0.8; // 80% threshold for very confident predictions

            // First pass: Check for high confidence matches
            for (const item of result) {
                const label = item.label.toLowerCase();
                const confidence = item.score;

                console.log(`Checking: ${label} - Confidence: ${confidence}`);

                // For very high confidence predictions, do a more thorough check
                if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
                    // Split the label by common separators to check each word/phrase
                    const labelParts = label.split(/,|\s|\/|-/).filter(part => part.trim().length > 0);

                    for (const part of labelParts) {
                        // Try to match each part against our waste map keys
                        for (const [key, category] of Object.entries(wasteCategoryMap)) {
                            if (key.includes(part) || part.includes(key)) {
                                bestMatch = { label: category, confidence };
                                break;
                            }
                        }
                        if (bestMatch) break;
                    }
                }

                // Standard threshold check for direct matches
                if (!bestMatch && confidence >= CONFIDENCE_THRESHOLD) {
                    if (wasteCategoryMap[label]) {
                        bestMatch = { label: wasteCategoryMap[label], confidence };
                        break;
                    }

                    // Check partial matches
                    for (const [key, category] of Object.entries(wasteCategoryMap)) {
                        if (label.includes(key) || key.includes(label)) {
                            bestMatch = { label: category, confidence };
                            break;
                        }
                    }
                }

                if (bestMatch) break;
            }

            // Special case for garbage truck with very high confidence
            if (!bestMatch) {
                for (const item of result) {
                    if (item.score > 0.9 && item.label.toLowerCase().includes("garbage") ||
                        item.label.toLowerCase().includes("trash") ||
                        item.label.toLowerCase().includes("waste")) {
                        // If we detect something strongly related to waste, assume it's mixed waste
                        bestMatch = { label: "mixed waste", confidence: item.score };
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

    // Update disposal instructions to include new categories
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
            vehicle: 'This is not waste, but a vehicle used for waste collection.',
            'mixed waste': 'Separate recyclables and dispose of according to local regulations.'
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
