import React, { useCallback, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import colors from "../../../utils/colors";
import { getFontSize } from '../../../utils/fontUtils';

import { LinearGradient } from 'react-native-linear-gradient';

import LeftArrow from '../../../img/Home/Quiz/LeftArrow.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';

const { height } = Dimensions.get('window');

function TodayQuiz2Screen(): React.JSX.Element {
    const navigation = useNavigation();
    const apiUrl = process.env.REACT_APP_API_URL;

    const [quizTitle, setQuizTitle] = useState("");
    const [quizText, setQuizText] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [responseMessage, setResponseMessage] = useState(""); // 서버에서 받은 메시지 상태 추가

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('token');
                const response = await fetch(`${apiUrl}/quiz/getQuiz?timestamp=${new Date().getTime()}`, {
                    method: 'GET',
                    headers: {
                        "Cache-Control": 'no-store',
                        "Content-Type": "application/json",
                        access: `${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    console.log(result.data);
                    setQuizTitle(result.data.quizTitle);
                    // 받아온 데이터가 문자열일 경우 JSON 파싱
                    const parsedQuizText = typeof result.data.quizText === 'string'
                        ? JSON.parse(result.data.quizText)
                        : result.data.quizText;
                    // 최대 4개의 보기만 사용
                    setQuizText(parsedQuizText.slice(0, 4));
                } else {
                    console.error(result.message);
                }
            } catch (error) {
                console.error('Error fetching today quiz data:', error);
            }
        };

        fetchQuizData();
    }, []);

    const handleSelectAnswer = (answer) => {
        setSelectedAnswer(answer);
        console.log(answer);
    };

    const handleNavigateQuizPress = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('token');
            const response = await fetch(`${apiUrl}/quiz/answer?myAnswer=${selectedAnswer}`, {
                method: 'POST',
                headers: {
                    "Cache-Control": 'no-store',
                    "Content-Type": "application/json",
                    access: `${accessToken}`,
                },
                body: JSON.stringify({
                    selectedAnswer,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(result);
            if (result.success) {
                if (result.data === "정답입니다.") {
                    navigation.navigate("TodayQuizCorrectScreen");
                } else {
                    setResponseMessage(result.data);
                    navigation.navigate("TodayQuizWrongScreen", {
                        data: result.data,
                    });
                }
            } else {
                console.error(result.message);
                setResponseMessage(result.message);  // Handle failure messages
            }
        } catch (error) {
            console.error('Error submitting quiz answer:', error);
            setResponseMessage('퀴즈 제출에 실패했습니다.');
        }
    };

    const isImageUrl = (url: string) => {
        return url.startsWith('https://') && (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg'));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.pop()}>
                    <LeftArrow
                        style={styles.closeIcon}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.TopTextContainer}>
                <View style={[styles.rowContainer, { marginBottom: 10 }]}>
                    <Text style={styles.GreenText}>{formattedDate}</Text>
                    <Text style={[styles.GreenText, { color: colors.lightblack }]}> 오늘의 퀴즈</Text>
                </View>
                <View style={styles.rowContainer}>
                    <Text style={styles.questionMark}>Q. </Text>
                    <Text style={styles.BoldLargeText}>{quizTitle}</Text>
                </View>
            </View>

            <View style={styles.TwoAnswerContainer}>
                {quizText.length > 0 && quizText.map((answer, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleSelectAnswer(`${index + 1}`)}
                    >
                        <View style={[
                              styles.Answer,
                              selectedAnswer === `${index + 1}` && styles.selected, // 비교 조건 수정
                        ]}>
                            {isImageUrl(answer) ? (
                                <Image source={{ uri: answer }} style={styles.answerImage} />
                            ) : (
                                <Text>{answer}</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={[
                    styles.BtnContainer,
                    { backgroundColor: selectedAnswer === null ? '#D3D3D3' : 'transparent' }
                ]}
                disabled={selectedAnswer === null}
                onPress={handleNavigateQuizPress}
            >
                <LinearGradient
                    colors={selectedAnswer === null ? ['#D3D3D3', '#D3D3D3'] : ['#9BC9FE', '#69E6A2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.completeButton}
                >
                    <Text style={styles.completeButtonText}>제출하기</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: 18,
        height: 56,
    },
    closeIcon: {
        marginTop: 10,
        width: 11.13,
        height: 18,
    },
    TopTextContainer: {
        paddingHorizontal: 22,
        marginTop: 29,
    },
    TwoAnswerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: 30,
    },
    Answer: {
        width: 168,
        height: 158,
        margin: 10,
        padding: 4,
        backgroundColor: '#EFF0F2',
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selected: {
        borderColor: colors.green,
        borderWidth: 4,
    },
    answerImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    rowContainer: {
        flexDirection: 'row',
    },
    GreenText: {
        color: colors.green,
        fontSize: getFontSize(16),
        fontWeight: '400',
    },
    BoldLargeText: {
            color: colors.black,
            fontSize: getFontSize(25),
            fontWeight: '800',
            lineHeight: 34,
            flex: 1,
            flexShrink: 1,
    },
    questionMark: {
        fontSize: getFontSize(25),
        fontWeight: '800',
        color: colors.green,
        lineHeight: 34,
    },
    BtnContainer: {
        position: 'absolute',
        bottom: 50,
        left: 16,
        right: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
    },
    completeButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TodayQuiz2Screen;
