import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Save an assignment to Firestore
 * @param {string} userId - User ID
 * @param {Object} assignmentData - Assignment data to save
 * @returns {Promise<string>} Document ID
 */
export async function saveAssignment(userId, assignmentData) {
  try {
    const assignmentDoc = {
      userId,
      assignmentTopic: assignmentData.assignmentTopic,
      courseMaterials: assignmentData.courseMaterials?.substring(0, 5000) || '', // Limit size
      selectedOpinion: assignmentData.selectedOpinion,
      summary: assignmentData.summary,
      finalAssignment: assignmentData.finalAssignment,
      verifiedSources: assignmentData.verifiedSources || [],
      uploadedFiles: assignmentData.uploadedFiles || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'completed'
    };

    const docRef = await addDoc(collection(db, 'assignments'), assignmentDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error saving assignment:', error);
    throw new Error(`Failed to save assignment: ${error.message}`);
  }
}

/**
 * Get all assignments for a user
 * @param {string} userId - User ID
 * @param {number} maxResults - Maximum number of results (default: 50)
 * @returns {Promise<Array>} Array of assignments
 */
export async function getUserAssignments(userId, maxResults = 50) {
  try {
    const assignmentsRef = collection(db, 'assignments');
    
    // Try to query with orderBy, if it fails (missing index), fetch all and sort client-side
    let querySnapshot;
    try {
      const q = query(
        assignmentsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      // If index doesn't exist, fetch all user assignments and sort client-side
      console.warn('Firestore index not found, fetching all and sorting client-side:', indexError);
      const q = query(
        assignmentsRef,
        where('userId', '==', userId),
        limit(maxResults * 2) // Fetch more to account for client-side sorting
      );
      querySnapshot = await getDocs(q);
    }

    const assignments = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      assignments.push({
        id: doc.id,
        ...data
      });
    });

    // If we had to fetch without orderBy, sort client-side
    if (assignments.length > 0 && !assignments[0].createdAt) {
      // If createdAt is missing, just return as-is
      return assignments;
    }

    // Sort by createdAt if not already sorted (client-side fallback)
    assignments.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime; // Descending order
    });

    return assignments.slice(0, maxResults);
  } catch (error) {
    console.error('Error getting user assignments:', error);
    throw new Error(`Failed to get assignments: ${error.message}`);
  }
}

/**
 * Get a single assignment by ID
 * @param {string} assignmentId - Assignment document ID
 * @returns {Promise<Object>} Assignment data
 */
export async function getAssignment(assignmentId) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Assignment not found');
    }
  } catch (error) {
    console.error('Error getting assignment:', error);
    throw new Error(`Failed to get assignment: ${error.message}`);
  }
}

/**
 * Update an assignment
 * @param {string} assignmentId - Assignment document ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export async function updateAssignment(assignmentId, updateData) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    throw new Error(`Failed to update assignment: ${error.message}`);
  }
}

/**
 * Delete an assignment
 * @param {string} assignmentId - Assignment document ID
 * @returns {Promise<void>}
 */
export async function deleteAssignment(assignmentId) {
  try {
    const docRef = doc(db, 'assignments', assignmentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting assignment:', error);
    throw new Error(`Failed to delete assignment: ${error.message}`);
  }
}

/**
 * Create or update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<void>}
 */
export async function saveUserProfile(userId, profileData) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // Update existing profile - don't overwrite wordBalance if it exists
      const updateData = { ...profileData };
      // Preserve existing wordBalance if not being updated
      if (!updateData.wordBalance && userSnap.data().wordBalance !== undefined) {
        delete updateData.wordBalance; // Don't update balance if not provided
      }
      await updateDoc(userRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new profile - initialize with 1500 words for new users
      await setDoc(userRef, {
        userId,
        ...profileData,
        wordBalance: 1500, // New users get 1500 words
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw new Error(`Failed to save user profile: ${error.message}`);
  }
}

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        id: userSnap.id,
        ...data,
        wordBalance: data.wordBalance !== undefined ? data.wordBalance : 1500 // Default to 1500 if not set
      };
    } else {
      // If user doesn't exist, create profile with default balance
      await setDoc(userRef, {
        userId,
        wordBalance: 1500,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return {
        id: userId,
        wordBalance: 1500
      };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

/**
 * Deduct words from user balance
 * @param {string} userId - User ID
 * @param {number} wordCount - Number of words to deduct
 * @returns {Promise<Object>} Updated user profile with new balance
 */
export async function deductWordBalance(userId, wordCount) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }

    const currentBalance = userSnap.data().wordBalance || 1500;
    const newBalance = Math.max(0, currentBalance - wordCount);

    await updateDoc(userRef, {
      wordBalance: newBalance,
      updatedAt: serverTimestamp()
    });

    return {
      id: userId,
      wordBalance: newBalance,
      wordsDeducted: wordCount
    };
  } catch (error) {
    console.error('Error deducting word balance:', error);
    throw new Error(`Failed to deduct word balance: ${error.message}`);
  }
}

/**
 * Add words to user balance (for purchases)
 * @param {string} userId - User ID
 * @param {number} wordCount - Number of words to add
 * @returns {Promise<Object>} Updated user profile with new balance
 */
export async function addWordBalance(userId, wordCount) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create user profile if it doesn't exist
      await setDoc(userRef, {
        userId,
        wordBalance: 1500 + wordCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      return {
        id: userId,
        wordBalance: 1500 + wordCount,
        wordsAdded: wordCount
      };
    }

    const currentBalance = userSnap.data().wordBalance || 1500;
    const newBalance = currentBalance + wordCount;

    await updateDoc(userRef, {
      wordBalance: newBalance,
      updatedAt: serverTimestamp()
    });

    return {
      id: userId,
      wordBalance: newBalance,
      wordsAdded: wordCount
    };
  } catch (error) {
    console.error('Error adding word balance:', error);
    throw new Error(`Failed to add word balance: ${error.message}`);
  }
}

/**
 * Check if user has sufficient word balance
 * @param {string} userId - User ID
 * @param {number} requiredWords - Number of words required
 * @returns {Promise<Object>} Balance check result
 */
export async function checkWordBalance(userId, requiredWords) {
  try {
    const profile = await getUserProfile(userId);
    const currentBalance = profile.wordBalance || 1500;
    const hasSufficientBalance = currentBalance >= requiredWords;

    return {
      hasSufficientBalance,
      currentBalance,
      requiredWords,
      remainingBalance: currentBalance - requiredWords
    };
  } catch (error) {
    console.error('Error checking word balance:', error);
    throw new Error(`Failed to check word balance: ${error.message}`);
  }
}

