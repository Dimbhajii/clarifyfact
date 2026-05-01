import { supabase } from '../firebase';

export async function saveAssignment(userId, assignmentData) {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      user_id: userId,
      assignment_topic: assignmentData.assignmentTopic,
      course_materials: assignmentData.courseMaterials?.substring(0, 5000) || '',
      selected_opinion: assignmentData.selectedOpinion,
      summary: assignmentData.summary,
      final_assignment: assignmentData.finalAssignment,
      verified_sources: assignmentData.verifiedSources || [],
      uploaded_files: assignmentData.uploadedFiles || [],
      status: 'completed',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save assignment: ${error.message}`);
  return data.id;
}

export async function getUserAssignments(userId, maxResults = 50) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(maxResults);

  if (error) throw new Error(`Failed to get assignments: ${error.message}`);

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    assignmentTopic: row.assignment_topic,
    courseMaterials: row.course_materials,
    selectedOpinion: row.selected_opinion,
    summary: row.summary,
    finalAssignment: row.final_assignment,
    verifiedSources: row.verified_sources,
    uploadedFiles: row.uploaded_files,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getAssignment(assignmentId) {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (error) throw new Error(`Failed to get assignment: ${error.message}`);

  return {
    id: data.id,
    userId: data.user_id,
    assignmentTopic: data.assignment_topic,
    courseMaterials: data.course_materials,
    selectedOpinion: data.selected_opinion,
    summary: data.summary,
    finalAssignment: data.final_assignment,
    verifiedSources: data.verified_sources,
    uploadedFiles: data.uploaded_files,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateAssignment(assignmentId, updateData) {
  const mapped = {};
  if (updateData.assignmentTopic !== undefined) mapped.assignment_topic = updateData.assignmentTopic;
  if (updateData.courseMaterials !== undefined) mapped.course_materials = updateData.courseMaterials;
  if (updateData.selectedOpinion !== undefined) mapped.selected_opinion = updateData.selectedOpinion;
  if (updateData.summary !== undefined) mapped.summary = updateData.summary;
  if (updateData.finalAssignment !== undefined) mapped.final_assignment = updateData.finalAssignment;
  if (updateData.verifiedSources !== undefined) mapped.verified_sources = updateData.verifiedSources;
  if (updateData.status !== undefined) mapped.status = updateData.status;

  const { error } = await supabase
    .from('assignments')
    .update(mapped)
    .eq('id', assignmentId);

  if (error) throw new Error(`Failed to update assignment: ${error.message}`);
}

export async function deleteAssignment(assignmentId) {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw new Error(`Failed to delete assignment: ${error.message}`);
}

export async function saveUserProfile(userId, profileData) {
  const mapped = {
    id: userId,
    email: profileData.email,
    display_name: profileData.displayName || profileData.display_name,
    photo_url: profileData.photoURL || profileData.photo_url,
    provider: profileData.provider,
  };

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, word_balance')
    .eq('id', userId)
    .single();

  if (existing) {
    const update = { ...mapped };
    delete update.id;
    delete update.word_balance;
    const { error } = await supabase.from('profiles').update(update).eq('id', userId);
    if (error) throw new Error(`Failed to save user profile: ${error.message}`);
  } else {
    const { error } = await supabase.from('profiles').insert({ ...mapped, word_balance: 1500 });
    if (error) throw new Error(`Failed to save user profile: ${error.message}`);
  }
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  if (!data) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      word_balance: 1500,
    });
    if (insertError) throw new Error(`Failed to create user profile: ${insertError.message}`);
    return { id: userId, wordBalance: 1500 };
  }

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    photoURL: data.photo_url,
    provider: data.provider,
    wordBalance: data.word_balance ?? 1500,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deductWordBalance(userId, wordCount) {
  const profile = await getUserProfile(userId);
  const newBalance = Math.max(0, (profile.wordBalance || 1500) - wordCount);

  const { error } = await supabase
    .from('profiles')
    .update({ word_balance: newBalance })
    .eq('id', userId);

  if (error) throw new Error(`Failed to deduct word balance: ${error.message}`);
  return { id: userId, wordBalance: newBalance, wordsDeducted: wordCount };
}

export async function addWordBalance(userId, wordCount) {
  const profile = await getUserProfile(userId);
  const newBalance = (profile.wordBalance || 1500) + wordCount;

  const { error } = await supabase
    .from('profiles')
    .update({ word_balance: newBalance })
    .eq('id', userId);

  if (error) throw new Error(`Failed to add word balance: ${error.message}`);
  return { id: userId, wordBalance: newBalance, wordsAdded: wordCount };
}

export async function checkWordBalance(userId, requiredWords) {
  const profile = await getUserProfile(userId);
  const currentBalance = profile.wordBalance || 1500;
  return {
    hasSufficientBalance: currentBalance >= requiredWords,
    currentBalance,
    requiredWords,
    remainingBalance: currentBalance - requiredWords,
  };
}
