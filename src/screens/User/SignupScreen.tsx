import * as React from 'react'
import { 
    StyleSheet, 
    Text, 
    View, 
} from 'react-native';

function SignupScreen(): React.JSX.Element {
    return(
        <View style={styles.container}>
            <Text>screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
})

export default SignupScreen;