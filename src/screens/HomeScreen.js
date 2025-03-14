// import { StatusBar } from 'expo-status-bar';
// import React, { useContext, useState, useEffect } from 'react';
// import { StyleSheet, Text, View, Dimensions, ScrollView, SafeAreaView, Animated } from 'react-native';
// import TestChart from '../components/pie-chart';
// import HeaderLogo from '../components/headerLogo';
// import ThemeContext from '../context/ThemeContext';
// import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
// import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';

// export default function HomeScreen({ navigation }) {
//     const { theme } = useContext(ThemeContext);
//     const [firstName, setFirstName] = useState('');
//     const [numberOfItems, setNumberOfItems] = useState(0);
//     const [counts, setCounts] = useState({ plastic: 0, metal: 0, ewaste: 0 });
//     const fadeAnim = new Animated.Value(0);

//     useEffect(() => {
//         Animated.timing(fadeAnim, {
//             toValue: 1,
//             duration: 1000,
//             useNativeDriver: true,
//         }).start();
//     }, []);

//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const currentUser = FIREBASE_AUTH.currentUser;
//                 if (currentUser) {
//                     const userDocRef = doc(FIRESTORE_DB, 'users', currentUser.uid);
//                     const userDocSnap = await getDoc(userDocRef);
//                     if (userDocSnap.exists()) {
//                         setFirstName(userDocSnap.data().firstName);
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error fetching user data:', error);
//             }
//         };
//         fetchData();
//     }, []);

//     useEffect(() => {
//         let unsubscribe;
//         const fetchScannedItems = async () => {
//             try {
//                 const currentUser = FIREBASE_AUTH.currentUser;
//                 if (currentUser) {
//                     const q = query(collection(FIRESTORE_DB, 'scannedItems'), where('userId', '==', currentUser.uid));
//                     unsubscribe = onSnapshot(q, (snapshot) => {
//                         let plastic = 0, metal = 0, ewaste = 0;
//                         snapshot.forEach((doc) => {
//                             const data = doc.data();
//                             if (data.materialType === 'Plastic') plastic++;
//                             else if (data.materialType === 'Metal') metal++;
//                             else if (data.materialType === 'E-waste') ewaste++;
//                         });
//                         setCounts({ plastic, metal, ewaste });
//                         setNumberOfItems(snapshot.size);
//                     });
//                 }
//             } catch (error) {
//                 console.error('Error fetching scanned items:', error);
//             }
//         };
//         fetchScannedItems();
//         return () => unsubscribe && unsubscribe();
//     }, []);

//     return (
//         <SafeAreaView style={styles.safeArea}>
//             <HeaderLogo />
//             <ScrollView contentContainerStyle={styles.scrollViewContainer}>
//                 <View style={styles.container}>
//                     <StatusBar style="auto" />
//                     <Animated.Text style={[styles.welcome_text, { opacity: fadeAnim }]}>Hello, <Text style={styles.name}>{firstName}</Text>!</Animated.Text>
//                     <View style={styles.chartContainer}>
//                         <TestChart counts={numberOfItems} plastic={counts.plastic} metal={counts.metal} ewaste={counts.ewaste} />
//                         <View style={styles.legendContainer}>
//                             <View style={[styles.legendItem, { backgroundColor: '#2D5A3D' }]} /><Text style={styles.legendText}>Plastic</Text>
//                             <View style={[styles.legendItem, { backgroundColor: '#99DAB3' }]} /><Text style={styles.legendText}>Metal</Text>
//                             <View style={[styles.legendItem, { backgroundColor: '#FFFFFF', borderWidth: 1 }]} /><Text style={styles.legendText}>E-Waste</Text>
//                         </View>
//                     </View>
//                     <View style={styles.summaryContainer}>
//                         <Text style={styles.summaryText}>You've recycled <Text style={styles.highlight}>{numberOfItems}</Text> items!</Text>
//                     </View>
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#E8F5E9',
//     },
//     container: {
//         flex: 1,
//         alignItems: 'center',
//         paddingTop: 20,
//     },
//     welcome_text: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: '#2D5A3D',
//         textAlign: 'center',
//         marginBottom: 15,
//     },
//     name: {
//         color: '#388E3C',
//         fontWeight: 'bold',
//     },
//     chartContainer: {
//         alignItems: 'center',
//         marginVertical: 15,
//     },
//     legendContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 10,
//     },
//     legendItem: {
//         width: 20,
//         height: 20,
//         marginHorizontal: 5,
//     },
//     legendText: {
//         fontSize: 14,
//         color: '#2D5A3D',
//         fontWeight: '600',
//     },
//     summaryContainer: {
//         backgroundColor: '#C8E6C9',
//         borderRadius: 10,
//         padding: 15,
//         marginTop: 20,
//         width: '90%',
//         alignItems: 'center',
//     },
//     summaryText: {
//         fontSize: 16,
//         color: '#2D5A3D',
//     },
//     highlight: {
//         color: '#1B5E20',
//         fontWeight: 'bold',
//     },
// });








import { StatusBar } from 'expo-status-bar';
import React, { useContext, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import TestChart from '../components/pie-chart';
import HeaderLogo from '../components/headerLogo';
import ThemeContext from '../context/ThemeContext';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig'; // Ensure this imports correctly
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore'; // Import Firestore functions correctly

export default function HomeScreen({ navigation }) {
    const { theme } = useContext(ThemeContext);
    const [firstName, setFirstName] = useState('');
    const [numberOfItems, setNumberOfItems] = useState(0);
    const [counts, setCounts] = useState({ plastic: 0, metal: 0, ewaste: 0 });

    useEffect(() => {
        const fetchDataFromFirestore = async () => {
            try {
                const currentUser = FIREBASE_AUTH.currentUser;
                if (currentUser) {
                    const userId = currentUser.uid;
                    const userDocRef = doc(FIRESTORE_DB, 'users', userId); // Ensure doc is correctly imported
                    const userDocSnap = await getDoc(userDocRef); // Use getDoc function from Firestore

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setFirstName(userData.firstName);
                    } else {
                        console.log('User document does not exist.');
                    }
                } else {
                    console.log('No current user.');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchDataFromFirestore();
    }, []);

    useEffect(() => {
        let unsubscribeScannedItemsListener;

        const fetchScannedItemsCount = async () => {
            try {
                const currentUser = FIREBASE_AUTH.currentUser;
                if (currentUser) {
                    const userId = currentUser.uid;
                    const scannedItemsRef = collection(FIRESTORE_DB, 'scannedItems');
                    const q = query(scannedItemsRef, where('userId', '==', userId));

                    unsubscribeScannedItemsListener = onSnapshot(q, (querySnapshot) => {
                        setNumberOfItems(querySnapshot.size);
                        let plastic = 0;
                        let metal = 0;
                        let ewaste = 0;

                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.materialType === 'Plastic') {
                                plastic += 1;
                            } else if (data.materialType === 'Metal') {
                                metal += 1;
                            } else if (data.materialType === 'E-waste') {
                                ewaste += 1;
                            }
                        });
                        console.log(plastic, metal, ewaste);
                        setCounts({ plastic, metal, ewaste });
                    });
                } else {
                    console.log('No current user.');
                }
            } catch (error) {
                console.error('Error fetching scanned items count:', error);
            }
        };

        fetchScannedItemsCount();

        return () => {
            if (unsubscribeScannedItemsListener) {
                unsubscribeScannedItemsListener(); // Cleanup function
            }
        };
    }, []);

    const { width } = Dimensions.get('window');
    const baseFontSize = width > 600 ? 24 : 16;

    const Square = () => {
        return <View style={styles.square} />;
    };
    const Square1 = () => {
        return <View style={styles.square1} />;
    };
    const Square2 = () => {
        return <View style={styles.square2} />;
    };

    const styles = StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
        },
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 5,
            width: '85%',
        },
        chartContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 10,
            paddingBottom: 20,
            width: '85%',
            alignSelf: 'center',
        },
        welcome_text: {
            fontSize: 15,
            fontFamily: 'Nunito-Regular',
            color: theme === 'dark' ? '#F8F8F8' : '#2D5A3D',
            textAlign: 'center',
            marginBottom: 20,
        },
        name: {
            color: theme === 'dark' ? '#00DF82' : '#68A77C',
            fontFamily: 'Nunito-Regular',
        },
        squares_container: {
            paddingTop: 50,
            flexDirection: 'row',
            alignItems: 'center',
        },
        square: {
            width: 50,
            height: 50,
            backgroundColor: '#2D5A3D',
            marginHorizontal: 5,
        },
        square1: {
            width: 50,
            height: 50,
            backgroundColor: '#99DAB3',
            marginHorizontal: 5,
        },
        square2: {
            width: 50,
            height: 50,
            backgroundColor: '#FFFFFF',
            marginHorizontal: 5,
        },
        category: {
            color: theme === 'dark' ? '#F8F8F8' : '#2D5A3D',
            marginHorizontal: 5,
            fontSize: 10,
            fontFamily: 'Nunito-Regular',
            textAlign: 'center',
        },
        summary_container: {
            paddingTop: 75,
            paddingBottom: 40,
            alignItems: 'center',
            width: '90%',
            justifyContent: 'center',
        },
        summary_text: {
            fontSize: 15,
            fontFamily: 'Nunito-Regular',
            color: theme === 'dark' ? '#F8F8F8' : '#2D5A3D',
            textAlign: 'center',
        },
        summary_word: {
            color: theme === 'dark' ? '#F8F8F8' : '#2D5A3D',
            fontFamily: 'Nunito-Regular',
        },
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <HeaderLogo />
            <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                <View style={styles.container}>
                    <StatusBar style="auto" />
                    <Text style={styles.welcome_text}>
                        Hello, <Text style={styles.name}>{firstName}</Text>!
                    </Text>

                    <View style={styles.chartContainer}>
                        <TestChart counts={numberOfItems} plastic={counts.plastic} metal={counts.metal} ewaste={counts.ewaste}/>

                        <View style={styles.squares_container}>
                            <Square />
                            <Text style={styles.category}>Plastic</Text>
                            <Square1 />
                            <Text style={styles.category}>Metal</Text>
                            <Square2 />
                            <Text style={styles.category}>E-Waste</Text>
                        </View>
                    </View>

                    <View style={styles.summary_container}>
                        <Text style={styles.summary_text}>
                            <Text style={styles.summary_word}>Summary:</Text>
                            {"\n"}
                            You've recycled a total of <Text style={styles.name}>{numberOfItems}</Text> items!
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// export const numberOfItems = 17;