import { supabase } from '../lib/supabase.js'

export const SupabaseService = {
  // Authentication methods
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // Analysis methods
  async saveAnalysis(analysisData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('analyses')
      .insert([
        {
          user_id: user.id,
          input_data: analysisData.inputData,
          selected_sections: analysisData.selectedSections,
          analysis_result: analysisData.analysisResult,
          created_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  },

  async getAnalyses() {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAnalysis(id) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    return data
  },

  async updateAnalysis(id, analysisData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('analyses')
      .update({
        input_data: analysisData.inputData,
        selected_sections: analysisData.selectedSections,
        analysis_result: analysisData.analysisResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    return data[0]
  },

  async deleteAnalysis(id) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Document upload methods
  async uploadDocument(file, folder = 'documents') {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) throw error
    return data
  },

  async getDocumentUrl(path) {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path)

    return data.publicUrl
  },

  async deleteDocument(path) {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path])

    if (error) throw error
  },

  // Methodology methods
  async saveMethodology(methodologyData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('methodologies')
      .insert([
        {
          user_id: user.id,
          name: methodologyData.name,
          content: methodologyData.content,
          description: methodologyData.description,
          created_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) throw error
    return data[0]
  },

  async getMethodologies() {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('methodologies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateMethodology(id, methodologyData) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { data, error } = await supabase
      .from('methodologies')
      .update({
        name: methodologyData.name,
        content: methodologyData.content,
        description: methodologyData.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) throw error
    return data[0]
  },

  async deleteMethodology(id) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error('User must be authenticated')

    const { error } = await supabase
      .from('methodologies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
  },

  // Real-time subscriptions
  subscribeToAnalyses(callback) {
    return supabase
      .channel('analyses')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'analyses' 
        }, 
        callback
      )
      .subscribe()
  },

  unsubscribe(subscription) {
    supabase.removeChannel(subscription)
  }
} 