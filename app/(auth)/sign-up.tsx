import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignUp = () => {
  return (
    <View>
      <Text> SignUp</Text>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded text-white p-4 bg-primary"
      >
        Sign In
      </Link>
    </View>
  );
};

export default SignUp;
