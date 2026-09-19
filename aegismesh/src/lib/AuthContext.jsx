import React,{createContext,useState,useContext,useEffect,useCallback} from 'react';
import { base44 } from '@/api/base44Client';
const AuthContext=createContext();
export const AuthProvider=({children})=>{
  const [user,setUser]=useState(null),[isAuthenticated,setIsAuthenticated]=useState(false),[isLoadingAuth,setIsLoadingAuth]=useState(true),[isLoadingPublicSettings,setIsLoadingPublicSettings]=useState(true),[authError,setAuthError]=useState(null),[authChecked,setAuthChecked]=useState(false),[appPublicSettings,setAppPublicSettings]=useState(null);
  const checkUserAuth=useCallback(async()=>{setIsLoadingAuth(true);setAuthError(null);if(!base44.auth.hasToken()){setUser(null);setIsAuthenticated(false);setIsLoadingAuth(false);setAuthChecked(true);return;}try{const u=await base44.auth.me();setUser(u);setIsAuthenticated(true);}catch(error){base44.auth.setToken('');setUser(null);setIsAuthenticated(false);if(error.status!==401)setAuthError({type:'unknown',message:error.message});}finally{setIsLoadingAuth(false);setAuthChecked(true);}},[]);
  const checkAppState=useCallback(async()=>{setIsLoadingPublicSettings(true);try{setAppPublicSettings(await base44.app.getPublicSettings());}catch(error){setAuthError({type:'unknown',message:error.message});}finally{setIsLoadingPublicSettings(false);}await checkUserAuth();},[checkUserAuth]);
  useEffect(()=>{checkAppState();},[checkAppState]);
  const logout=(redirect=true)=>{base44.auth.logout();setUser(null);setIsAuthenticated(false);setAuthChecked(true);if(redirect)window.location.href='/';};
  const navigateToLogin=()=>base44.auth.redirectToLogin(window.location.href);
  return <AuthContext.Provider value={{user,isAuthenticated,isLoadingAuth,isLoadingPublicSettings,authError,appPublicSettings,authChecked,logout,navigateToLogin,checkUserAuth,checkAppState}}>{children}</AuthContext.Provider>;
};
export const useAuth=()=>{const c=useContext(AuthContext);if(!c)throw new Error('useAuth must be used within AuthProvider');return c;};
