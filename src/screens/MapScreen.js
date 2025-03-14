import React, { useEffect, useState, useRef, useContext } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Modal, TextInput, TouchableWithoutFeedback, Alert, Platform, Image, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import BinModal from '../components/BinModal';
import CustomAlert from '../components/alertModal';
import ThemeContext from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';

// Import Firestore functions
import {
  FIRESTORE_DB,
  GeoPoint,
  Timestamp,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  // onSnapshot,
  increment
} from '../../firebaseConfig';
import { onSnapshot } from 'firebase/firestore';
import { analyzeImage } from '../backend/binAPI'

const MapScreen = ({ route }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [binDescription, setBinDescription] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [binImageUri, setBinImageUri] = useState(null);
  const [viewReportModalVisible, setViewReportModalVisible] = useState(false);
  const mapRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);

  const [types] = useState(['General Trash', 'General Recyclables', 'E-waste', 'Hazardous Waste']);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const { binType, itemScanned } = route.params || {};
  const markerRefs = useRef({});
  const [scannedItem, setScannedItem] = useState(itemScanned || false);

  const resetModalOptions = () => {
    setSelectedTypes([]);
  };

  const renderTypeSelectModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={typeModalVisible}
      onRequestClose={() => setTypeModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setTypeModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.modalContentType}>
              <Text style={styles.modalTitle}>Select Types</Text>
              <View style={styles.optionsContainer}>
                {types.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedTypes.includes(option) && styles.selectedOptionButton,
                    ]}
                    onPress={() => handleToggleOption(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.button} onPress={() => handleSaveTypes(selectedTypes)}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const handleToggleOption = (option) => {
    setSelectedTypes((prevSelected) =>
      prevSelected.includes(option)
        ? prevSelected.filter((item) => item !== option)
        : [...prevSelected, option]
    );
  };

  const handleSaveTypes = (types) => {
    setSelectedTypes(types);
    setInputModalVisible(true);
    setTypeModalVisible(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        watchLocation();
      };
      requestLocationPermission();
      fetchMarkers();
    }, [])
  );

  useEffect(() => {
    if (markers.length && binType) {
      navigateToNearestBin();
      setScannedItem(false);
    }
  }, [markers, binType, scannedItem]);

  const watchLocation = async () => {
    return new Promise((resolve, reject) => {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 5000,
          distanceInterval: 1,
        },
        (location) => {
          setLocation(location.coords);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
          resolve();
        },
        (error) => {
          setErrorMsg('Error watching location');
          reject(error);
        }
      );
    });
  };

  const fetchMarkers = async () => {
    try {
      const binCollectionRef = collection(FIRESTORE_DB, 'bins');
      const reportCollectionRef = collection(FIRESTORE_DB, 'reports');

      onSnapshot(binCollectionRef, async (binSnapshot) => {
        onSnapshot(reportCollectionRef, async (reportSnapshot) => {
          const reports = reportSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          const fetchedMarkers = await Promise.all(binSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            const relatedReports = reports.filter(report => report.binId === doc.id);
            let base64Image = null;

            if (data.binImageId) {
              base64Image = await fetchImageData(data.binImageId);
            }

            return {
              id: doc.id,
              latitude: data.binLocation.latitude,
              longitude: data.binLocation.longitude,
              binImageId: data.binImageId,
              base64Image: base64Image,
              description: data.binDescription,
              types: data.binType,
              reports: relatedReports,
            };
          }));

          setMarkers(fetchedMarkers);
        }, (error) => {
          console.error('Failed to get reports from DB:', error);
          setAlertMessage('Failed to get reports from database');
          setAlertVisible(true);
        });
      }, (error) => {
        console.error('Failed to get bins from DB:', error);
        setAlertMessage('Failed to get bins from database');
        setAlertVisible(true);
      });
    } catch (error) {
      console.error('Failed to set up snapshot listeners:', error);
      setAlertMessage('Failed to set up snapshot listeners');
      setAlertVisible(true);
    }
  };

  const fetchImageData = async (imageId) => {
    try {
      const imageDocRef = doc(FIRESTORE_DB, 'bin_images', imageId);
      const imageDoc = await getDoc(imageDocRef);
      if (imageDoc.exists()) {
        return imageDoc.data().base64Data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching image data:', error);
      return null;
    }
  };

  const uploadImageToFirebase = async (uri) => {
    if (!uri) {
      console.error('Invalid URI:', uri);
      return;
    }

    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const resizedUri = manipulatedImage.uri;
      const filename = resizedUri.substring(resizedUri.lastIndexOf('/') + 1);

      // Convert image to Base64
      const base64Image = await FileSystem.readAsStringAsync(resizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate a unique ID for the image
      const imageId = `bin_image_${Date.now()}`;

      // Save the image data to Firestore
      const imageDocRef = doc(FIRESTORE_DB, 'bin_images', imageId);
      await setDoc(imageDocRef, {
        filename: filename,
        base64Data: base64Image,
        uploadedAt: new Date(),
      });

      console.log('Image uploaded successfully to Firestore');

      // Return the image ID instead of a download URL
      return imageId;
    } catch (error) {
      console.error('Error during upload:', error.message);
      console.error('Stack Trace:', error.stack);
      return null;
    }
  };

  // const handleAddBin = async () => {
  //   setIsLoading(true);
  //   try {
  //     const auth = getAuth();
  //     const user = auth.currentUser;

  //     if (!user) {
  //       setAlertMessage('User is not authenticated');
  //       setAlertVisible(true);
  //       return;
  //     }

  //     const imageId = await uploadImageToFirebase(binImageUri);

  //     console.log("image uploaded to firebase")

  //     if (!imageId) {
  //       setAlertMessage('Failed to upload image');
  //       setAlertVisible(true);
  //       return;
  //     }

  //     const newBinData = {
  //       binDescription: binDescription,
  //       binImageId: imageId,
  //       binType: selectedTypes,
  //       addedBy: user.uid,
  //       binApproval: null,
  //       binLocation: new GeoPoint(location.coords.latitude, location.coords.longitude),
  //       dateAdded: Timestamp.fromDate(new Date()),
  //     };

  //     console.log('Attempting to add new bin data:', newBinData);

  //     const docRef = await addDoc(collection(FIRESTORE_DB, 'bins'), newBinData);

  //     console.log('New bin added with ID:', docRef.id);

  //     const newMarker = {
  //       id: docRef.id,
  //       latitude: location.coords.latitude,
  //       longitude: location.coords.longitude,
  //       binImageId: imageId,
  //       description: binDescription,
  //       types: selectedTypes,
  //       reports: []
  //     };

  //     setMarkers(prevMarkers => [...prevMarkers, newMarker]);
  //     setModalVisible(false);
  //     setInputModalVisible(false);
  //     setBinDescription('');
  //     setTypeModalVisible(false);
  //     setBinImageUri(null);
  //     setSelectedTypes([]);

  //     setAlertMessage('Bin successfully added!');
  //     setAlertVisible(true);
  //   } catch (error) {
  //     console.error('Error adding bin to database:', error);
  //     setAlertMessage('Failed to add bin to database: ' + error.message);
  //     setAlertVisible(true);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleAddBin = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setAlertMessage('User is not authenticated');
        setAlertVisible(true);
        return;
      }

      const imageId = await uploadImageToFirebase(binImageUri);

      console.log("image uploaded to firebase")

      if (!imageId) {
        setAlertMessage('Failed to upload image');
        setAlertVisible(true);
        return;
      }

      // Check if location exists and has the correct structure
      if (!location) {
        setAlertMessage('Location data not available');
        setAlertVisible(true);
        return;
      }
      console.log("location data: ", location.latitude)

      // Use the correct location structure
      // If location already has latitude/longitude directly
      const newBinData = {
        binDescription: binDescription,
        binImageId: imageId,
        binType: selectedTypes,
        addedBy: user.uid,
        binApproval: null,
        binLocation: {
          latitude: location.latitude || (location.coords && location.coords.latitude),
          longitude: location.longitude || (location.coords && location.coords.longitude)
        },
        dateAdded: new Date(),
      };

      console.log('Attempting to add new bin data:', newBinData);

      const docRef = await addDoc(collection(FIRESTORE_DB, 'bins'), newBinData);

      console.log('New bin added with ID:', docRef.id);

      const newMarker = {
        id: docRef.id,
        latitude: location.latitude || (location.coords && location.coords.latitude),
        longitude: location.longitude || (location.coords && location.coords.longitude),
        binImageId: imageId,
        description: binDescription,
        types: selectedTypes,
        reports: []
      };

      setMarkers(prevMarkers => [...prevMarkers, newMarker]);
      setModalVisible(false);
      setInputModalVisible(false);
      setBinDescription('');
      setTypeModalVisible(false);
      setBinImageUri(null);
      setSelectedTypes([]);

      setAlertMessage('Bin successfully added!');
      setAlertVisible(true);
    } catch (error) {
      console.error('Error adding bin to database:', error);
      setAlertMessage('Failed to add bin to database: ' + error.message);
      setAlertVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getDistance = (loc1, loc2) => {
    const toRadian = (angle) => (Math.PI / 180) * angle;
    const distance = (a, b) => (Math.PI / 180) * (a - b);
    const RADIUS_OF_EARTH_IN_KM = 6371;

    const dLat = distance(loc2.latitude, loc1.latitude);
    const dLon = distance(loc2.longitude, loc1.longitude);

    const lat1 = toRadian(loc1.latitude);
    const lat2 = toRadian(loc2.latitude);

    const a =
      Math.pow(Math.sin(dLat / 2), 2) +
      Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.asin(Math.sqrt(a));

    return RADIUS_OF_EARTH_IN_KM * c * 1000; // distance in meters
  };

  const getBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const takePhoto = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage('Please sign in to add a bin!');
      setAlertVisible(true);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 1,
    };

    Alert.alert(
      'Take a Photo',
      'Please take a photo of the bin.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              resetModalOptions();
              let result = await ImagePicker.launchCameraAsync(options);
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const { uri } = result.assets[0];
                if (uri) {
                  try {
                    setIsLoading(true);
                    const base64 = await getBase64(uri);
                    const isGarbage = await analyzeImage(base64);
                    setIsLoading(false);
                    if (isGarbage) {
                      setBinImageUri(uri);
                      setTypeModalVisible(true);
                    } else {
                      Alert.alert(
                        'Image Analysis',
                        'The image does not appear to contain a bin or garbage-related object. Please try again or retake the image.'
                      );
                    }
                  } catch (error) {
                    setIsLoading(false);
                    console.error('Error analyzing image:', error);
                    Alert.alert(
                      'Error',
                      'An unexpected error occurred while analyzing the image. Please try again later.'
                    );
                  }
                } else {
                  console.error('Error: URI is undefined');
                  Alert.alert(
                    'Error',
                    'No image was provided. Please select or capture an image and try again.'
                  );
                }
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert(
                'Error',
                'An error occurred while taking the photo. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const checkLocation = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setAlertMessage('Please sign in to add a bin!');
      setAlertVisible(true);
      return;
    }

    const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'bins'));
    const existingBins = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        latitude: data.binLocation.latitude,
        longitude: data.binLocation.longitude,
      };
    });

    const binExists = existingBins.some(bin => getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: bin.latitude, longitude: bin.longitude }
    ) <= 6); // 6 meters is roughly 20 feet

    if (binExists) {
      setAlertMessage('A bin already exists at this location!');
      setAlertVisible(true);
      return;
    }
    else {
      takePhoto();
    }
  }

  const handleReportSubmit = async () => {
    if (selectedMarker) {
      if (reportText.length < 5) {
        console.log("reportText is less than 5 characters");
        alert('Brevity is key but please say a little more than that.');
        return;
      }
      try {
        await addDoc(collection(FIRESTORE_DB, 'reports'), {
          binId: selectedMarker.id,
          reportText,
          timestamp: new Date(),
          trueCount: 0,
          falseCount: 0,
          uid: user ? user.uid : null,
        });
        setAlertMessage('Report submitted successfully!');
        setReportModalVisible(false); // Close the modal after submission
        setReportText(''); // Clear the report text
      } catch (error) {
        setAlertMessage('Failed to submit report');
        console.log(error);
      }
      setAlertVisible(true);
    }
  };

  const handleVoteOnFirstReport = (selectedMarker, isTrueFalse) => {
    if (!user) {
      console.log("User not logged in");
      alert("You must be logged in to vote.");
      return;
    }
    if (selectedMarker.reports && selectedMarker.reports.length > 0) {
      const firstReportId = selectedMarker.reports[0].id;
      handleVote(firstReportId, isTrueFalse);
    } else {
      console.log("No reports available to vote on for this bin");
    }
  };

  const handleVote = async (reportId, isTrueVote) => {
    const reportRef = doc(FIRESTORE_DB, 'reports', reportId);

    try {
      // Firestore transaction to increment the correct counter
      await updateDoc(reportRef, {
        // Conditional update based on the value of isTrueVote
        trueCount: isTrueVote ? increment(1) : increment(0),
        falseCount: isTrueVote ? increment(0) : increment(1),
      });

      // Check if the criteria for deletion are met
      const updatedDoc = await getDoc(reportRef);
      const data = updatedDoc.data();

      if (data.trueCount >= 5) {
        // Remove the associated bin and its image
        await deleteBinAndImage(data.binId);
        await deleteDoc(reportRef);
      }
      // delete the report
      if (data.falseCount >= 5) {
        await deleteDoc(reportRef);
      }

      setViewReportModalVisible(false); // Close the modal after voting
      alert('Thanks for your input!');
    } catch (error) {
      console.error('Failed to record vote:', error);
      alert('Failed to record vote, please try again or send in a report to the team.');
    }
  };

  const deleteBinAndImage = async (binId) => {
    try {
      const binRef = doc(FIRESTORE_DB, 'bins', binId);
      const binDoc = await getDoc(binRef);

      // if the bin doesn't exist for some reason (edge case)
      if (!binDoc.exists()) {
        console.log(`Bin with binId ${binId} does not exist.`);
        return;
      }

      const binData = binDoc.data();
      const imageUrl = binData.binImage;

      // if the imageUrl for the bin exists
      if (imageUrl) {
        // Decode the URL to handle special characters
        const decodedUrl = decodeURIComponent(imageUrl);
        console.log('Decoded URL:', decodedUrl); // Debugging line

        // Extract the filename from the decoded URL
        const filename = decodedUrl.substring(decodedUrl.lastIndexOf('/') + 1, decodedUrl.indexOf('?'));
        console.log('Filename:', filename); // Debugging line

        const imageRef = ref(FIREBASE_STORAGE, `binImages/${filename}`);
        await deleteObject(imageRef);  // Delete the image from Firebase Storage
      }

      await deleteDoc(binRef);  // Delete the bin document
      console.log(`Bin and image deleted for binId ${binId}`);
    } catch (error) {
      console.error('Error deleting bin and image:', error);
    }
  };

  const navigateToMarker = (marker) => {
    const url = `http://maps.apple.com/?daddr=${marker.latitude},${marker.longitude}`;
    Linking.openURL(url).catch(err => {
      setAlertMessage('Failed to open navigation');
      setAlertVisible(true);
    });
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
  };

  const styles = StyleSheet.create({
    calloutContainer: {
      width: 200, // Adjust width as needed
      padding: 10,
      backgroundColor: theme === 'dark' ? '#042222' : '#dfebd8',
      borderRadius: 10,
      alignItems: 'center',
    },
    calloutTitle: {
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      fontFamily: 'Nunito',
      fontWeight: 'bold',
      marginBottom: 5,
    },
    calloutImage: {
      width: '100%', // Use percentage to scale
      height: 200, // Fixed height to maintain aspect ratio
      marginBottom: 10,
    },
    typesContainer: {
      margin: 5,
    },
    calloutTypes: {
      fontFamily: 'Nunito',
      fontSize: 10,
      color: theme === 'dark' ? '#b7c4b3' : '#2D5A3D',
    },
    calloutTypesTitle: {
      fontSize: 12,
      fontFamily: 'Nunito',
    },
    calloutDescription: {
      fontFamily: 'Nunito',
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      textAlign: 'center',
      marginBottom: 2,
    },
    calloutNavigate: {
      fontFamily: 'Nunito',
      color: theme === 'dark' ? '#f9fff7' : 'green',
      paddingBottom: 5,
    },
    calloutReport: {
      fontSize: 10,
      fontFamily: 'Nunito',
      color: theme === 'dark' ? '#f9fff7' : 'green',
    },
    calloutReportPin: {
      fontSize: 15,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '90%', // Increase width to 90%
      height: '25%', // Adjust height to ensure it takes more space
      backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalContentType: {
      width: '90%', // Increase width to 90%
      height: '30%', // Adjust height to ensure it takes more space
      backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 16, // Adjust font size to be smaller
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      fontFamily: 'Nunito',
      fontWeight: 'bold',
      marginBottom: 10, // Adjust bottom margin to be smaller
      lineHeight: 20, // Adjust line height for better spacing
    },
    textInput: {
      width: '100%',
      padding: 15, // Increase padding
      borderWidth: 1,
      borderColor: theme === 'dark' ? '#b7c4b390' : '#2D5A3D',
      color: theme === 'dark' ? '#b7c4b3' : '#2D5A3D',
      borderRadius: 10, // Increase border radius
      marginBottom: 20, // Increase bottom margin
    },
    button: {
      backgroundColor: theme === 'dark' ? '#bed4bc' : '#2D5A3D',
      padding: 13, // Increase padding
      borderRadius: 10, // Increase border radius
    },
    buttonText: {
      color: 'white',
      fontFamily: 'Nunito',
      fontWeight: 'bold',
      fontSize: 12, // Increase font size
    },
    optionsContainer: {
      marginBottom: 5,
      justifyContent: 'center',
      alignItems: 'center', // Center items horizontally
    },
    optionButton: {
      padding: 10,
      marginVertical: 5,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
    },
    selectedOptionButton: {
      borderColor: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      borderWidth: 1,
    },
    optionText: {
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      fontSize: 14,
      fontFamily: 'Nunito',
    },
    reportText: {
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      fontFamily: 'Nunito',
      fontSize: 15,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 20,
    },
    voteButton: {
      backgroundColor: theme === 'dark' ? '#bed4bc' : '#2D5A3D',
      padding: 10,
      borderRadius: 10,
      margin: 5,
    },
    voteButtonText: {
      color: 'white',
      fontFamily: 'Nunito',
      fontWeight: 'bold',
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        initialRegion={{
          latitude: 28.693602091083623,
          longitude: 77.21464383448563,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        followsUserLocation
      >
        {markers.map((marker, index) => (
          <Marker key={index} coordinate={marker} ref={ref => markerRefs.current[marker.id] = ref}>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Bin {index + 1}</Text>
                {marker.base64Image && (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${marker.base64Image}` }}
                    style={styles.calloutImage}
                    resizeMode="contain"
                  />
                )}
                {marker.description && (
                  <Text style={styles.calloutDescription}>{marker.description}</Text>
                )}
                {marker.types && marker.types.length > 0 && (
                  <View style={styles.typesContainer}>
                    <Text style={styles.calloutTypes}>Types: {marker.types.join(', ')}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => navigateToMarker(marker)}>
                  <Text style={styles.calloutNavigate}>Navigate Here</Text>
                </TouchableOpacity>
                {marker.reports && marker.reports.length > 0 ? (
                  <TouchableOpacity onPress={() => {
                    setSelectedMarker(marker);
                    setViewReportModalVisible(true);
                  }}>
                    <Text style={styles.calloutReportPin}>❗</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => {
                    setSelectedMarker(marker);
                    setReportModalVisible(true);
                  }}>
                    <Text style={styles.calloutReport}>Report Bin Updates</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9ee8a4" />
        </View>
      )}

      <TouchableOpacity
        style={{
          width: '90%',
          height: 50,
          alignSelf: 'center',
          position: 'absolute',
          backgroundColor: 'green',
          bottom: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={checkLocation}
      >
        <Text style={{ color: 'white' }}>Add Bin</Text>
      </TouchableOpacity>

      <BinModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onNavigate={takePhoto}
      />

      {errorMsg ? <Text>{errorMsg}</Text> : null}

      <Modal
        animationType="fade"
        transparent={true}
        visible={inputModalVisible}
        onRequestClose={() => setInputModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setInputModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Describe the bin location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter description"
                  placeholderTextColor="#2D5A3D90"
                  value={binDescription}
                  onChangeText={setBinDescription}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleAddBin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Add Bin</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      {renderTypeSelectModal()}
      <Modal
        animationType="fade"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setReportModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Report Bin Updates</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter report"
                  placeholderTextColor="#2D5A3D90"
                  value={reportText}
                  onChangeText={setReportText}
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleReportSubmit}
                >
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {renderTypeSelectModal()}
      <CustomAlert
        visible={alertVisible}
        title="Alert"
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        onConfirm={handleAlertConfirm}
      />
      <Modal
        animationType="fade"
        transparent={true}
        visible={viewReportModalVisible}
        onRequestClose={() => setViewReportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setViewReportModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Bin Reports</Text>
                {selectedMarker && selectedMarker.reports.map(report => (
                  <Text key={report.id} style={styles.reportText}>{report.reportText}</Text>
                ))}
                <View style={{ flexDirection: 'row', padding: 30, justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={[styles.voteButton, { marginRight: 15 }]}
                    onPress={() => handleVoteOnFirstReport(selectedMarker, false)}
                  >
                    <Text style={styles.voteButtonText}>False</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voteButton, { marginLeft: 15 }]}
                    onPress={() => handleVoteOnFirstReport(selectedMarker, true)}
                  >
                    <Text style={styles.voteButtonText}>True</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default MapScreen;
