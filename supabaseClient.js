// 1. Caminho universal atualizado para evitar o erro 404
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 2. Sua URL limpa e correta
const supabaseUrl = 'https://anlolratleoiwispjuel.supabase.co'

// 3. Sua chave anônima mantida corretamente
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubG9scmF0bGVvaXdpc3BqdWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzOTcwNTAsImV4cCI6MjA5Njk3MzA1MH0.8o4i3iR8D8iJZn-bTu04jVG_5denS4z1aqeEqOOwRw0'

// 4. Inicialização do cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
