import { useSignUp } from "@clerk/expo";
import { type Href, Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function SignUp() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");

  const [localError, setLocalError] = React.useState<string | null>(null);
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [codeTouched, setCodeTouched] = React.useState(false);

  const isBusy = fetchStatus === "fetching";
  const emailTrimmed = emailAddress.trim();
  const canSubmit = isValidEmail(emailTrimmed) && password.length >= 8 && !isBusy;

  const showVerify =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  const handleSubmit = async () => {
    setLocalError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isValidEmail(emailTrimmed)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    const { error } = await signUp.password({
      emailAddress: emailTrimmed,
      password,
    });

    if (error) {
      console.error(JSON.stringify(error, null, 2));
      setLocalError("We couldn’t create your account. Please check your details.");
      return;
    }

    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    setLocalError(null);
    setCodeTouched(true);

    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 4) {
      setLocalError("Enter the verification code we sent to your email.");
      return;
    }

    await signUp.verifications.verifyEmailCode({ code: trimmed });

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask);
            return;
          }

          const url = decorateUrl("/(tabs)");
          if (typeof window !== "undefined" && url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.replace(url as Href);
          }
        },
      });
      return;
    }

    console.error("Sign-up not complete:", signUp);
    setLocalError("We couldn’t verify that code. Please try again.");
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">H</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Hagey</Text>
                <Text className="auth-wordmark-sub">SMART SPENDING</Text>
              </View>
            </View>

            <Text className="auth-title">{showVerify ? "Check your email" : "Create account"}</Text>
            <Text className="auth-subtitle">
              {showVerify
                ? "Enter the code we sent to confirm your email and secure your account."
                : "Create your account to start tracking subscriptions and stay on top of renewals."}
            </Text>
          </View>

          <View className="auth-card">
            {showVerify ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className={"auth-input"}
                    value={code}
                    onChangeText={setCode}
                    onBlur={() => setCodeTouched(true)}
                    placeholder="Enter code"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    keyboardType="numeric"
                    autoCorrect={false}
                    editable={!isBusy}
                  />
                  {(codeTouched && !!localError) || errors?.fields?.code ? (
                    <Text className="auth-error">
                      {errors?.fields?.code?.message ?? localError}
                    </Text>
                  ) : (
                    <Text className="auth-helper">Didn’t get it? You can request a new one.</Text>
                  )}
                </View>

                <Pressable
                  className={"auth-button" + (isBusy ? " auth-button-disabled" : "")}
                  onPress={handleVerify}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="auth-button-text">Verify & continue</Text>
                  )}
                </Pressable>

                <Pressable
                  className="auth-secondary-button"
                  onPress={() => signUp.verifications.sendEmailCode()}
                  disabled={isBusy}
                >
                  <Text className="auth-secondary-button-text">Send a new code</Text>
                </Pressable>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    className={
                      "auth-input" +
                      ((emailTouched && !isValidEmail(emailTrimmed)) || errors?.fields?.emailAddress
                        ? " auth-input-error"
                        : "")
                    }
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="Enter your email"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    editable={!isBusy}
                  />
                  {errors?.fields?.emailAddress ? (
                    <Text className="auth-error">{errors.fields.emailAddress.message}</Text>
                  ) : emailTouched && !isValidEmail(emailTrimmed) ? (
                    <Text className="auth-error">Enter a valid email address.</Text>
                  ) : (
                    <Text className="auth-helper">We’ll send a verification code after signup.</Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={
                      "auth-input" +
                      ((passwordTouched && password.length < 8) || errors?.fields?.password
                        ? " auth-input-error"
                        : "")
                    }
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="Create a password"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    secureTextEntry
                    editable={!isBusy}
                  />
                  {errors?.fields?.password ? (
                    <Text className="auth-error">{errors.fields.password.message}</Text>
                  ) : passwordTouched && password.length < 8 ? (
                    <Text className="auth-error">Use at least 8 characters.</Text>
                  ) : (
                    <Text className="auth-helper">Use 8+ characters. Avoid reusing old passwords.</Text>
                  )}
                </View>

                {localError ? <Text className="auth-error">{localError}</Text> : null}

                <Pressable
                  className={"auth-button" + (!canSubmit ? " auth-button-disabled" : "")}
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                >
                  {isBusy ? <ActivityIndicator /> : <Text className="auth-button-text">Create account</Text>}
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Already have an account?</Text>
                  <Link href="/(auth)/sign-in" asChild>
                    <Text className="auth-link">Sign in</Text>
                  </Link>
                </View>

                <View nativeID="clerk-captcha" />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
