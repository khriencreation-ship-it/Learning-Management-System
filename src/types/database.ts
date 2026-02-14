export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          role: 'student' | 'tutor' | 'admin'
          identifier: string | null
          status: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: 'student' | 'tutor' | 'admin'
          identifier?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          role?: 'student' | 'tutor' | 'admin'
          identifier?: string | null
          status?: string | null
        }
      }
      cohorts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          batch: string
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'upcoming'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          batch: string
          start_date: string
          end_date: string
          status?: 'active' | 'completed' | 'upcoming'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          batch?: string
          start_date?: string
          end_date?: string
          status?: 'active' | 'completed' | 'upcoming'
        }
      }
      courses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          instructor: string | null
          code: string | null
          image: string | null
          topics_count: number
          lessons_count: number
          quizzes_count: number
          assignments_count: number
          published_at: string | null
          status: 'active' | 'draft' | 'archived'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          instructor?: string | null
          code?: string | null
          image?: string | null
          topics_count?: number
          lessons_count?: number
          quizzes_count?: number
          assignments_count?: number
          published_at?: string | null
          status?: 'active' | 'draft' | 'archived'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          instructor?: string | null
          code?: string | null
          image?: string | null
          topics_count?: number
          lessons_count?: number
          quizzes_count?: number
          assignments_count?: number
          published_at?: string | null
          status?: 'active' | 'draft' | 'archived'
        }
      }
      cohort_courses: {
        Row: {
          cohort_id: string
          course_id: string
          created_at: string
        }
        Insert: {
          cohort_id: string
          course_id: string
          created_at?: string
        }
        Update: {
          cohort_id?: string
          course_id?: string
          created_at?: string
        }
      }
      course_enrollments: {
        Row: {
          course_id: string
          student_id: string
          cohort_id: string | null
          enrolled_at: string
          status: string | null
          progress: number | null
        }
        Insert: {
          course_id: string
          student_id: string
          cohort_id?: string | null
          enrolled_at?: string
          status?: string | null
          progress?: number | null
        }
        Update: {
          course_id?: string
          student_id?: string
          cohort_id?: string | null
          enrolled_at?: string
          status?: string | null
          progress?: number | null
        }
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          summary: string | null
          order_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          summary?: string | null
          order_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          summary?: string | null
          order_index?: number | null
          created_at?: string
        }
      }
      module_items: {
        Row: {
          id: string
          module_id: string
          type: 'lesson' | 'quiz' | 'assignment' | 'live-class'
          title: string
          summary: string | null
          content: string | null
          video_url: string | null
          duration: number | null
          order_index: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          module_id: string
          type?: 'lesson' | 'quiz' | 'assignment' | 'live-class'
          title: string
          summary?: string | null
          content?: string | null
          video_url?: string | null
          duration?: number | null
          order_index?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          type?: 'lesson' | 'quiz' | 'assignment' | 'live-class'
          title: string
          summary?: string | null
          content?: string | null
          video_url?: string | null
          duration?: number | null
          order_index?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}

// Convenience interfaces for easier use in components
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Cohort = Database['public']['Tables']['cohorts']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row']
export type CohortCourse = Database['public']['Tables']['cohort_courses']['Row']
export type CourseModule = Database['public']['Tables']['course_modules']['Row']
export type ModuleItem = Database['public']['Tables']['module_items']['Row']
