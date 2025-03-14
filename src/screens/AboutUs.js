import React, { useState, useContext } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ThemeContext from '../context/ThemeContext';
import shyam from '../../assets/me5.png';
import yarmin from '../../assets/me2.png';
import nandini from '../../assets/me1.png';
import sakshi from '../../assets/me3.png';
import { ScrollView } from 'react-native';

const recyclingData = [
  {
      image: shyam,
      description: 'Shyam Kalariya',
      school: 'Computer Engineering',
      major: 'AI/ML Dev',
  },  
  {
    image: yarmin,
    description: 'Yarmin Buha',
    school: 'Computer Engineering',
    major: 'React-Native Dev',
  },       
  {
    image: nandini,
    description: 'Nandini Chauhan',
    school: 'Computer Engineering',
    major: 'Frontend Dev',
  },
  {
    image: sakshi,
    description: 'Sakshi Shah',
    school: 'Computer Engineering',
    major: 'Frontend Dev',
  },
  // Add more recycling symbols and their descriptions here
];

export default function UserSettings({ onUpdateBio }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack(); // Navigate back to the previous screen
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
    },
    backButton: {
      paddingLeft:16,
      width: 80,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 10,
    },
    backButtonText: {
      color: theme === 'dark' ? '#9FBCA5' : '#2D5A3D',
      fontSize: 18,
    },
    safeArea: {
      flex: 1,
      backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
  },
  container: {
      flex: 1,
      padding: 20,

      backgroundColor: theme === 'dark' ? '#042222' : '#C4D8BF',
  },
  title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
      fontFamily: 'Nunito-Bold',
      fontWeight: 'bold',
  },
  card: {
      flexDirection: "row",
      backgroundColor: theme === 'dark' ? '#9FBCA5' : '#f5fff0',
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 5,
  },
  symbolImage: {
      width: 100,
      height: 100,
      resizeMode: 'contain',
      alignSelf: 'center',
  },
  description: {
      fontSize: 16,
      color: '#2D5A3D',
      marginVertical: 3,
      textAlign: 'center',
      fontFamily: 'Nunito-Regular',
  },
  productsTitle: {
      fontSize: 17,
      fontFamily: 'Nunito-Medium',
      marginTop: 10,
      color: '#2D5A3D',
  },
  productItem: {
      fontSize: 16,
      fontFamily: 'Nunito-Regular',
      color: '#2D5A3D',
      marginVertical: 2,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 10
  },
  nameText: {
    fontSize: 18,
    color: '#2D5A3D',
    marginVertical: 3,
    textAlign: 'center',
    fontFamily: 'Nunito-Bold',
  },
  jessicaFont: {
    textAlign:'center', 
    color: theme === 'dark' ? '#C4D8BF' : '#2D5A3D',
    fontFamily: 'Nunito-Bold',
  },
  });

  

  return (
    <SafeAreaView style={styles.container}>
    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
      <Text style={styles.backButtonText}>Back</Text>
    </TouchableOpacity>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
      <Text style={styles.title}>EcoBin Team</Text>
      
      {recyclingData.map((item, index) => (
        <View key={index} style={styles.card}>
          <Image source={item.image} style={styles.symbolImage} />
          <View style={styles.textContainer}>
            <Text style={styles.nameText}>{item.description}</Text>
            <Text style={styles.description}>{item.school}</Text>
            <Text style={styles.description}>{item.major}</Text>
          </View>
        </View>
      ))}
      {/* <Text style={styles.jessicaFont}>Honorary member: Jessica Huang</Text> */}
    </ScrollView>
  </SafeAreaView>
    
  );
}
