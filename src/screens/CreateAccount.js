import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback, Keyboard, SafeAreaView, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import ThemeContext from '../context/ThemeContext';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const CreateAccount = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const auth = FIREBASE_AUTH;

  const isValidPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  const checkUsernameExists = async (username) => {
    const usersCollectionRef = collection(FIRESTORE_DB, 'users');
    const q = query(usersCollectionRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const signUp = async () => {
    if (!firstName || !lastName || !email || !password || !retypePassword || !username) {
      alert('All fields are required!');
      return;
    }
    if (password !== retypePassword) {
      alert('Passwords do not match!');
      return;
    }
    if (!isValidPassword(password)) {
      alert('Password must be at least 8 characters long and contain one lowercase, one uppercase letter, and one number.');
      return;
    }
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      alert('Username already exists. Please choose another.');
      return;
    }
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const uid = response.user.uid;
      await setDoc(doc(FIRESTORE_DB, 'users', uid), {
        firstName,
        lastName,
        username,
        createdAt: new Date()
      });
      alert('Sign Up successful!');
      // navigation.navigate('LoginScreen');
    } catch (error) {
      alert('Sign up failed! ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container(theme)}>
            <View style={styles.headerContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer}>
                <AntDesign name="arrowleft" size={24} color={theme === 'dark' ? '#fff' : '#2D5A3D'} />
              </TouchableOpacity>
              <Text style={styles.headerText(theme)}>Sign Up</Text>
            </View>
            <View style={styles.formContainer}>
              <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#666" value={firstName} onChangeText={setFirstName} />
              <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#666" value={lastName} onChangeText={setLastName} />
              <TextInput style={styles.input} placeholder="Username" placeholderTextColor="#666" value={username} onChangeText={setUsername} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" keyboardType="email-address" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" secureTextEntry value={password} onChangeText={setPassword} />
              <TextInput style={styles.input} placeholder="Retype Password" placeholderTextColor="#666" secureTextEntry value={retypePassword} onChangeText={setRetypePassword} />
              <TouchableOpacity style={styles.signUpButton(theme)} onPress={signUp}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.switchText(theme)}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: (theme) => ({ flex: 1, backgroundColor: theme === 'dark' ? '#042222' : '#fff' }),
  scrollViewContainer: { flexGrow: 1 },
  container: (theme) => ({ flex: 1, paddingHorizontal: 20, backgroundColor: theme === 'dark' ? '#042222' : '#fff' }),
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: height * 0.02 },
  iconContainer: { position: 'absolute', left: 20 },
  headerText: (theme) => ({ fontSize: 24, fontWeight: 'bold', color: theme === 'dark' ? '#00DF82' : '#2D5A3D' }),
  formContainer: { alignItems: 'center', marginTop: height * 0.05 },
  input: { width: '80%', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginVertical: 10, backgroundColor: '#f5f5f5' },
  signUpButton: (theme) => ({ width: '80%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme === 'dark' ? '#1AB385' : '#2D5A3D', marginTop: 20 }),
  signUpButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  switchText: (theme) => ({ marginTop: 15, color: theme === 'dark' ? '#1AB385' : '#2D5A3D', fontSize: 16, textDecorationLine: 'underline' }),
});

export default CreateAccount;







// import React, { useContext, useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback, Keyboard, SafeAreaView, ScrollView } from 'react-native';
// import { AntDesign } from '@expo/vector-icons';
// import ThemeContext from '../context/ThemeContext';
// import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';

// function isValidPassword(password) {
//   // Regular expression to match the criteria
//   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

//   // Check if the password matches the criteria
//   return passwordRegex.test(password);
// }

// // Example usage:
// const password = "MyPassword123";
// console.log(isValidPassword(password)); // Output: true


// const { width, height } = Dimensions.get('window');

// const CreateAccount = ({ navigation }) => {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const { theme, toggleTheme } = useContext(ThemeContext);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [retypePassword, setRetypePassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [username, setUsername] = useState('');
//   const auth = FIREBASE_AUTH;

//   const checkUsernameExists = async (username) => {
//     const usersCollectionRef = collection(FIRESTORE_DB, 'users');
//     const q = query(usersCollectionRef, where('username', '==', username));
//     const querySnapshot = await getDocs(q);
//     return !querySnapshot.empty;
//   };
  


//   const signUp = async () => {

//     if (!firstName || !lastName || !email || !password || !retypePassword || !username) {
//       alert('All fields are required!');
//       return;
//     }

//     if (/\s/.test(username)) {
//       alert('Username should not contain spaces!');
//       return;
//     }

//     const validLength = username.length >= 3 && username.length <= 15;

//     if (!validLength) {
//       alert('Username should be between 3 and 15 letters!');
//       return;
//     }

//     if (!isValidPassword(password)) {
//       alert('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one digit. ');
//       return;
//     }

//     if (password !== retypePassword) {
//       alert('Passwords do not match!');
//       return;
//     }


//     try {
//       const usernameExists = await checkUsernameExists(username);
//       if (usernameExists) {
//         alert('Username already exists. Please choose another.');
//         return;
//       }


//       const response = await createUserWithEmailAndPassword(auth, email, password);
//       const uid = response.user.uid;

//       // Add user to Firestore
//       const userDocRef = doc(FIRESTORE_DB, 'users', uid);
//       await setDoc(userDocRef, {
//         firstName: firstName,
//         lastName: lastName,
//         username: username,
//         createdAt: new Date()
//       });

//       console.log(response);
     

//       alert('Sign Up successful!')
//     } catch (error) {
//       console.log(error);
//       alert('Sign up failed!' + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: theme === 'dark' ? '#042222' : '#fff',
//       paddingHorizontal: 20,
//     },
//     headerContainer: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginTop: height * 0.02, // Adjusted to 2% of screen height
//       position: 'relative', // Ensure relative positioning for absolute children
//     },
//     iconContainer: {
//       position: 'absolute',
//       left: 20,
//     },
//     headerText: {
//       fontSize: 24,
//       fontWeight: 'bold',
//       color: theme === 'dark' ? '#00DF82' : '#2D5A3D',
//     },
//     formContainer: {
//       alignItems: 'center',
//       marginTop: height * 0.05, // Further reduced from 10% to 5% of screen height
//     },
//     input: {
//       width: '80%', // Adjust width as needed
//       height: 50,
//       borderColor: '#ddd',
//       borderWidth: 1,
//       borderRadius: 5,
//       paddingHorizontal: 10,
//       marginVertical: 10,
//       backgroundColor: '#f5f5f5',
//     },
//     signUpButton: {
//       width: '80%', // Adjust width as needed
//       height: 50,
//       borderRadius: 5,
//       justifyContent: 'center',
//       alignItems: 'center',
//       backgroundColor: theme === 'dark' ? '#1AB385' : '#2D5A3D',
//       marginTop: 20,
//     },
//     signUpButtonText: {
//       color: '#fff',
//       fontSize: 18,
//     },
//     forgotPasswordButton: {
//       marginTop: 10,
//     },
//     forgotPasswordButtonText: {
//       color: theme === 'dark' ? '#1AB385' : '#2D5A3D',
//       fontSize: 16,
//     },
//     safeArea: {
//       flex: 1,
//       backgroundColor: theme === 'dark' ? '#042222' : '#fff',

//     },
//     scrollViewContainer: {
//       flexGrow: 1,
//     },
//   });



//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView contentContainerStyle={styles.scrollViewContainer}>
//         <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//           <View style={styles.container}>
//             <View style={styles.headerContainer}>
//               <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer}>
//                 <AntDesign name="close" size={24} color="gray" />
//               </TouchableOpacity>
//               <Text style={styles.headerText}>Sign Up</Text>
//             </View>

//             <View style={styles.formContainer}>
//               <TextInput value={firstName} style={styles.input} placeholder="First Name" placeholderTextColor="#666" onChangeText={(text) => setFirstName(text)} />
//               <TextInput value={lastName} style={styles.input} placeholder="Last Name" placeholderTextColor="#666" onChangeText={(text) => setLastName(text)} />
              
//               <TextInput value={username} style={styles.input} placeholder="Username" placeholderTextColor="#666" onChangeText={(text) => setUsername(text)} />
              
//               <TextInput value={email} style={styles.input} placeholder="Email" placeholderTextColor="#666" keyboardType="email-address" onChangeText={(text) => setEmail(text)} />
//               <TextInput value={password} style={styles.input} placeholder="Password" placeholderTextColor="#666" secureTextEntry onChangeText={(text) => setPassword(text)} />
//               <TextInput value={retypePassword} style={styles.input} placeholder="Retype Password" placeholderTextColor="#666" secureTextEntry onChangeText={(text) => setRetypePassword(text)} />

//               <TouchableOpacity style={styles.signUpButton} onPress={signUp}>
//                 <Text style={styles.signUpButtonText}>Sign Up</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </TouchableWithoutFeedback>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };


// export default CreateAccount;
