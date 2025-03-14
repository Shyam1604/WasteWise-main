// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { Alert } from 'react-native';
// import { GEMINI_API_KEY } from '@env';

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// export const analyzeImage = async (base64) => {
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//   const prompt = "Classify the object in the image as 'bin' or 'not bin'. Return 'true' if the object is a bin and 'false' otherwise.";

//   const imageParts = [
//     {
//       inlineData: {
//         data: base64,
//         mimeType: "image/jpeg"
//       }
//     }
//   ];

//   try {
//     const result = await model.generateContent([prompt, ...imageParts]);
//     const response = result.response;
//     const text = response.text().toLowerCase().trim();

//     console.log('Gemini API Response:', text);

//     if (text === 'true') {
//       return true;
//     } else if (text === 'false') {
//       return false;
//     } else {
//       console.error('Unexpected response:', text);
//       Alert.alert('Error', 'Unexpected response from the image analysis');
//       return false;
//     }
//   } catch (error) {
//     console.error('Failed to analyze image:', error);
//     Alert.alert('Error', 'Failed to analyze image');
//     return false;
//   }
// };


// // import OpenAI from 'openai';
// // import { OPENAI_API_KEY } from '@env';
// // import { Alert } from 'react-native';

// // const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// // export const analyzeImage = async (base64) => {
// //   const prompt = "Classify the object in the image as 'bin' or 'not bin'. Return 'true' if the object is a bin and 'false' otherwise.";

// //   const params = {
// //     model: "gpt-4o",
// //     messages: [
// //       {
// //         role: "system",
// //         content: "You are a helpful assistant designed to classify images.",
// //       },
// //       {
// //         role: "user",
// //         content: [
// //           { type: "text", text: prompt },
// //           {
// //             type: "image_url",
// //             image_url: {
// //               "url": `data:image/jpeg;base64,${base64}`,
// //               "detail": "low"
// //             },
// //           },
// //         ],
// //       },
// //     ],
// //   };

// //   try {
// //     const response = await openai.chat.completions.create(params);
// //     const result = response.choices[0].message.content.trim().toLowerCase();

// //     console.log('OpenAI API Response:', result);

// //     if (result === 'true') {
// //       return true;
// //     } else if (result === 'false') {
// //       return false;
// //     } else {
// //       console.error('Unexpected response:', result);
// //       Alert.alert('Error', 'Unexpected response from the image analysis');
// //       return false;
// //     }
// //     } catch (error) {
// //         console.error('Failed to analyze image:', error);
// //         Alert.alert('Error', 'Failed to analyze image');
// //         return false;
// //     }
// // };






import { Alert } from "react-native";

// Hugging Face API details
// const HUGGING_FACE_API_KEY = ""; // Replace with your actual API key
// const API_URL = "https://api-inference.huggingface.co/models/microsoft/resnet-50"; // Model endpoint

/**
 * Analyze an image using Hugging Face API to determine if it's a bin.
 * @param {string} base64 - Base64 string of the image.
 * @returns {boolean} - `true` if the object is a bin, otherwise `false`.
 */



// export const analyzeImage = async (base64) => {
//   try {
//     const payload = {
//       inputs: base64, // Pass only the Base64 string without the data:image prefix
//     };

//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     const result = await response.json();

//     if (result.error) {
//       console.error("Hugging Face API Error:", result.error);
//       Alert.alert("Error", "Failed to analyze image. Please try again.");
//       return false;
//     }

//     console.log("Hugging Face API Response:", result);

//     // Process results
//     const isBin = result.some((item) => item.label.toLowerCase() === "bin");
//     return isBin;
//   } catch (error) {
//     console.error("Failed to analyze image:", error);
//     Alert.alert("Error", "An error occurred while analyzing the image.");
//     return false;
//   }
// };


/**
 * Analyze an image using Hugging Face API to determine if it's a garbage-related object.
 * @param {string} base64 - Base64 string of the image.
 * @returns {boolean} - `true` if the object is a garbage-related item with accuracy >= 0.50, otherwise `false`.
 */
export const analyzeImage = async (base64) => {
  try {
    // Prepare request payload
    const payload = {
      inputs: base64, // Pass only the Base64 string without the data:image prefix
    };

    // Make API request
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Parse the response
    const result = await response.json();

    if (result.error) {
      console.error("Hugging Face API Error:", result.error);
      Alert.alert("Error", "Failed to analyze image. Please try again.");
      return false;
    }

    console.log("Hugging Face API Response:", result);

    // Filter predictions based on label and confidence score
    const garbageKeywords = ["ashcan", "trash can", "garbage can", "wastebin", "ash bin", "ash-bin", "ashbin", "dustbin", "trash barrel", "trash bin"]; // Add relevant keywords here
    const isGarbage = result.some(
      (item) =>
        garbageKeywords.includes(item.label.toLowerCase()) &&
        item.score >= 0.50
    );
    console.log("is garbage: ", isGarbage)
    return true;
  } catch (error) {
    console.error("Failed to analyze image:", error);
    Alert.alert("Error", "An error occurred while analyzing the image.");
    return false;
  }
};
