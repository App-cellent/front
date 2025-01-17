import * as React from 'react'
import { StyleSheet, Text, View, Image, ImageBackground } from 'react-native';

import CharacterRarity from '../../components/CharacterRarity';

function ResultScreen(): React.JSX.Element {
    return(
        <View style={styles.container}>
            <ImageBackground
                source={require('../../img/Character/circleGradient.png')}
                style={styles.background}
            >
                <Text style={styles.text}>
                    <Text style={styles.characterText}>새로운 캐릭터</Text>
                    {'가 나왔어요!'}
                </Text>
                <Image
                    source={require('../../img/Character/bonus/[17]earth.png')}
                    style={styles.characterImg}
                />
                <Text style={[styles.text, styles.marginBottom9]}>파란 지구</Text>
                <CharacterRarity rarity={4} />
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    background: {
        width: 384,
        height: 384,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text :{
        fontSize: 23,
        fontWeight: 700,
        textAlign: 'center',
    },
    characterText: {
        color: '#9BC9FE',
    },
    characterImg: {
        width: 210,
        height: 144,
        margin: 46,
    },
    marginBottom9: {
        marginBottom: 9,
    }
})

export default ResultScreen;