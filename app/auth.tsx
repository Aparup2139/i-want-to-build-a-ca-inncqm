import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

type Mode = "signin" | "signup";

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: "",
    message: "",
  });
  const [successModal, setSuccessModal] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });

  const showError = (title: string, message: string) => {
    setErrorModal({ visible: true, title, message });
  };

  const titleText = mode === "signin" ? "Sign In" : "Sign Up";
  const switchText = mode === "signin" ? "Don't have an account? Sign Up" : "Already have an account? Sign In";
  const switchMode = mode === "signin" ? "signup" : "signin";

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const handleEmailAuth = async () => {
    if (!email || !password) {
      showError("Validation Error", "Please enter your email and password.");
      return;
    }
    console.log(`[Auth] handleEmailAuth pressed`, { mode, email });
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        router.replace("/");
      } else {
        await signUpWithEmail(email, password, name);
        setSuccessModal({ visible: true, message: "Account created! You are now signed in." });
        // Navigation happens after user dismisses the success modal
      }
    } catch (error: any) {
      showError("Error", error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setSuccessModal({ visible: false, message: "" });
    router.replace("/");
  };

  const handleGoogleSignIn = async () => {
    console.log("[Auth] Google sign in pressed");
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (error: any) {
      showError("Error", error.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    console.log("[Auth] Apple sign in pressed");
    setLoading(true);
    try {
      await signInWithApple();
      router.replace("/");
    } catch (error: any) {
      showError("Error", error.message || "Apple sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    console.log(`[Auth] Switching mode to ${switchMode}`);
    setMode(switchMode);
    setEmail("");
    setPassword("");
    setName("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#0a1628", "#0d2137", "#0a1628"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🥗</Text>
            </View>
            <Text style={styles.appName}>CalorieTrack</Text>
            <Text style={styles.tagline}>Your personal nutrition companion</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{titleText}</Text>

            {mode === "signup" && (
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Name (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#8a9bb0"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#8a9bb0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#8a9bb0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>{titleText}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={handleSwitchMode}
              activeOpacity={0.7}
            >
              <Text style={styles.switchModeText}>{switchText}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Apple FIRST (App Store requirement) — iOS only */}
            {Platform.OS === "ios" && (
              <TouchableOpacity
                style={[styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.appleIcon}></Text>
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Google */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <Modal
        visible={errorModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() => setErrorModal({ ...errorModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIconWrapper}>
              <Text style={styles.alertIcon}>⚠️</Text>
            </View>
            <Text style={styles.alertTitle}>{errorModal.title}</Text>
            <Text style={styles.alertMessage}>{errorModal.message}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setErrorModal({ ...errorModal, visible: false })}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModal.visible}
        animationType="fade"
        transparent
        onRequestClose={handleSuccessOk}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIconWrapper}>
              <Text style={styles.alertIcon}>🎉</Text>
            </View>
            <Text style={styles.alertTitle}>Welcome!</Text>
            <Text style={styles.alertMessage}>{successModal.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={handleSuccessOk}>
              <Text style={styles.alertButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a1628",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a1628",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: "#8a9bb0",
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8a9bb0",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  switchModeButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 4,
  },
  switchModeText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#8a9bb0",
    fontSize: 13,
  },
  socialButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    gap: 10,
  },
  socialButtonText: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "600",
  },
  appleButton: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  appleButtonText: {
    color: "#000000",
  },
  appleIcon: {
    fontSize: 18,
    color: "#000000",
    lineHeight: 22,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
    width: 20,
    textAlign: "center",
  },
  termsText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    color: "#4a5a6a",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertModal: {
    backgroundColor: "#0d2137",
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 24,
    width: "85%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  alertIconWrapper: {
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 36,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#8a9bb0",
    marginBottom: 24,
    lineHeight: 22,
    textAlign: "center",
  },
  alertButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
