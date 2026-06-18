import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grdjvpjlmsahzpitttfx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGp2cGpsbXNhaHpwaXR0dGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTg5NjMsImV4cCI6MjA5NzM3NDk2M30.AJ2tOPIVznKhlSFu8D9cW-8uA-yZTdXY5xOnCb7ucDI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);