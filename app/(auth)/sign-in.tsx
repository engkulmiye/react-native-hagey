import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignIn = () => {
  return (
    <View>
      <Text> SignIn</Text>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded text-white p-4 bg-primary"
      >
        Create an accunt
      </Link>
    </View>
  );
};

export default SignIn;
