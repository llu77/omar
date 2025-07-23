import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    AuthError
  } from "firebase/auth";
  import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
  } from "firebase/firestore";
  import { auth, db } from "../firebase";
  
  export type UserRole = 'admin' | 'therapist' | 'patient';
  
  export interface UserData {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female';
    address?: string;
    profilePicture?: string;
    isActive: boolean;
    isEmailVerified: boolean;
    createdAt: any;
    updatedAt: any;
    lastLoginAt?: any;
    settings?: {
      notifications: boolean;
      language: 'ar' | 'en';
      theme: 'light' | 'dark';
    };
  }
  
  export interface AuthResponse {
    success: boolean;
    user?: User;
    userData?: UserData;
    error?: string;
  }
  
  class AuthService {
    // تسجيل مستخدم جديد
    async registerUser(
      email: string, 
      password: string, 
      displayName: string, 
      role: UserRole,
      additionalData?: Partial<UserData>
    ): Promise<AuthResponse> {
      try {
        // التحقق من عدم وجود المستخدم مسبقاً
        const existingUser = await this.checkUserExists(email);
        if (existingUser) {
          return {
            success: false,
            error: 'البريد الإلكتروني مستخدم بالفعل'
          };
        }
  
        // 1. إنشاء حساب المستخدم
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        // 2. تحديث معلومات المستخدم
        await updateProfile(user, { displayName });
  
        // 3. إرسال رسالة التحقق من البريد الإلكتروني
        await sendEmailVerification(user);
  
        // 4. إنشاء document المستخدم في Firestore
        const userData = await this.createUserDocument(user, role, additionalData);
  
        console.log("User registered successfully");
        return {
          success: true,
          user,
          userData
        };
      } catch (error) {
        console.error("Registration error:", error);
        return {
          success: false,
          error: this.getErrorMessage(error as AuthError)
        };
      }
    }
  
    // إنشاء document المستخدم
    private async createUserDocument(
      user: User, 
      role: UserRole,
      additionalData?: Partial<UserData>
    ): Promise<UserData> {
      const userDoc: UserData = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || '',
        role: role,
        isActive: true,
        isEmailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          notifications: true,
          language: 'ar',
          theme: 'light'
        },
        ...additionalData
      };
  
      try {
        await setDoc(doc(db, "users", user.uid), userDoc);
        console.log("User document created");
        
        // إذا كان المستخدم مريضاً، أنشئ document في مجموعة patients
        if (role === 'patient') {
          await this.createPatientDocument(user.uid, userDoc);
        }
        
        return userDoc;
      } catch (error) {
        console.error("Error creating user document:", error);
        throw error;
      }
    }
  
    // إنشاء document المريض
    private async createPatientDocument(userId: string, userData: UserData): Promise<void> {
      const patientDoc = {
        userId: userId,
        personalInfo: {
          fullName: userData.displayName,
          email: userData.email,
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          address: userData.address || ''
        },
        medicalInfo: {
          diagnosis: '',
          medicalHistory: [],
          currentMedications: [],
          allergies: []
        },
        therapistId: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
  
      try {
        await setDoc(doc(db, "patients", userId), patientDoc);
        console.log("Patient document created");
      } catch (error) {
        console.error("Error creating patient document:", error);
        throw error;
      }
    }
  
    // التحقق من وجود المستخدم
    async checkUserExists(email: string): Promise<boolean> {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    }
  
    // تسجيل الدخول
    async loginUser(email: string, password: string): Promise<AuthResponse> {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // التحقق من وجود document المستخدم
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          console.warn("User document not found, creating default...");
          // إنشاء document افتراضي إذا لم يكن موجوداً
          const userData = await this.createUserDocument(user, 'patient');
          
          // تحديث وقت آخر تسجيل دخول
          await this.updateLastLogin(user.uid);
          
          return {
            success: true,
            user,
            userData
          };
        }
  
        const userData = userDoc.data() as UserData;
  
        // التحقق من حالة المستخدم
        if (!userData.isActive) {
          await signOut(auth);
          return {
            success: false,
            error: 'الحساب معطل. يرجى التواصل مع الإدارة'
          };
        }
  
        // تحديث وقت آخر تسجيل دخول
        await this.updateLastLogin(user.uid);
  
        return {
          success: true,
          user,
          userData
        };
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: this.getErrorMessage(error as AuthError)
        };
      }
    }
  
    // تحديث وقت آخر تسجيل دخول
    private async updateLastLogin(userId: string): Promise<void> {
      try {
        await updateDoc(doc(db, "users", userId), {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating last login:", error);
      }
    }
  
    // إعادة تعيين كلمة المرور
    async resetPassword(email: string): Promise<AuthResponse> {
      try {
        await sendPasswordResetEmail(auth, email);
        return {
          success: true
        };
      } catch (error) {
        console.error("Password reset error:", error);
        return {
          success: false,
          error: this.getErrorMessage(error as AuthError)
        };
      }
    }
  
    // تحديث كلمة المرور
    async updateUserPassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) {
          return {
            success: false,
            error: 'المستخدم غير مسجل الدخول'
          };
        }
  
        // إعادة المصادقة
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
  
        // تحديث كلمة المرور
        await updatePassword(user, newPassword);
  
        return {
          success: true,
          user
        };
      } catch (error) {
        console.error("Update password error:", error);
        return {
          success: false,
          error: this.getErrorMessage(error as AuthError)
        };
      }
    }
  
    // تحديث معلومات المستخدم
    async updateUserProfile(updates: Partial<UserData>): Promise<AuthResponse> {
      try {
        const user = auth.currentUser;
        if (!user) {
          return {
            success: false,
            error: 'المستخدم غير مسجل الدخول'
          };
        }
  
        // تحديث displayName في Auth إذا تغير
        if (updates.displayName && updates.displayName !== user.displayName) {
          await updateProfile(user, { displayName: updates.displayName });
        }
  
        // تحديث document المستخدم
        await updateDoc(doc(db, "users", user.uid), {
          ...updates,
          updatedAt: serverTimestamp()
        });
  
        // الحصول على البيانات المحدثة
        const updatedDoc = await getDoc(doc(db, "users", user.uid));
        const userData = updatedDoc.data() as UserData;
  
        return {
          success: true,
          user,
          userData
        };
      } catch (error) {
        console.error("Update profile error:", error);
        return {
          success: false,
          error: this.getErrorMessage(error as AuthError)
        };
      }
    }
  
    // الحصول على بيانات المستخدم الحالي
    async getCurrentUserData(): Promise<UserData | null> {
      const user = auth.currentUser;
      if (!user) return null;
  
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          return userDoc.data() as UserData;
        }
        return null;
      } catch (error) {
        console.error("Error getting user data:", error);
        return null;
      }
    }
  
    // الحصول على بيانات مستخدم بواسطة ID
    async getUserById(userId: string): Promise<UserData | null> {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          return userDoc.data() as UserData;
        }
        return null;
      } catch (error) {
        console.error("Error getting user by ID:", error);
        return null;
      }
    }
  
    // مراقبة حالة المصادقة
    onAuthStateChange(callback: (user: User | null) => void): () => void {
      return onAuthStateChanged(auth, callback);
    }
  
    // تسجيل الخروج
    async logout(): Promise<void> {
      try {
        await signOut(auth);
        console.log("User logged out");
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    }
  
    // ترجمة رسائل الخطأ
    private getErrorMessage(error: AuthError): string {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'البريد الإلكتروني مستخدم بالفعل';
        case 'auth/invalid-email':
          return 'البريد الإلكتروني غير صالح';
        case 'auth/operation-not-allowed':
          return 'العملية غير مسموح بها';
        case 'auth/weak-password':
          return 'كلمة المرور ضعيفة جداً';
        case 'auth/user-disabled':
          return 'تم تعطيل هذا الحساب';
        case 'auth/user-not-found':
          return 'المستخدم غير موجود';
        case 'auth/wrong-password':
          return 'كلمة المرور غير صحيحة';
        case 'auth/invalid-credential':
          return 'بيانات الدخول غير صحيحة';
        case 'auth/network-request-failed':
          return 'خطأ في الاتصال بالشبكة';
        case 'auth/too-many-requests':
          return 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً';
        case 'auth/requires-recent-login':
          return 'يتطلب إعادة تسجيل الدخول';
        default:
          return 'حدث خطأ. يرجى المحاولة مرة أخرى';
      }
    }
  }
  
  export default new AuthService();