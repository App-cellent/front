import React, { useState, useEffect, useRef } from 'react';
import colors from "../../utils/colors";
import { getFontSize } from '../../utils/fontUtils';

import { startCounter, stopCounter } from 'react-native-accurate-step-counter';

import MainHeader from '../../components/MainHeader';
import LinearGradientBackground from 'react-native-linear-gradient';
import SeedIcon from '../../img/Home/SeedIcon.svg';

import AsyncStorage from '@react-native-async-storage/async-storage';

import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Image,
  Animated,
  Modal,
  Pressable
} from 'react-native';

function PedometerScreen(): React.JSX.Element {
    const currentDate = new Date();
    const apiUrl = process.env.REACT_APP_API_URL;

    const formattedDate = currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const [todayGoalYN, setTodayGoalYN] = useState(false);
    const [weekGoalYN, setWeekGoalYN] = useState(false);
    const [todayModalVisible, setTodayModalVisible] = useState(false);
    const [weekModalVisible, setWeekModalVisible] = useState(false);

    const [todayStep, setTodayStep] = useState(0);
    const [weekStep, setWeekStep] = useState(0);
    const [totalStep, setTotalStep] = useState(0);
    const [carbonReduction, setCarbonReduction] = useState(0.0);
    const todayTargetStep = 7000;
    const monthTargetStep = 50000;

    const [todayReward, setTodayReward] = useState(false);
    const [weekReward, setWeekReward] = useState(false);
    const [todayRewardState, setTodayRewardState] = useState(false);
    const [weekRewardState, setWeekRewardState] = useState(false);

    const confirmTargetStep = () => {
        if (todayStep >= todayTargetStep) setTodayGoalYN(true);
        else setTodayGoalYN(false);
        if (weekStep >= monthTargetStep) setWeekGoalYN(true);
        else setWeekGoalYN(false);
    }

    useEffect(() => {
        confirmTargetStep();

        const fetchStepData = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('token');
                const response = await fetch(`${apiUrl}/steps/summary?timestamp=${new Date().getTime()}`, {
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
                    setTodayStep(result.data.today);  // 오늘 걸음수
                    setWeekStep(result.data.week);     // 주간 걸음수
                    setTotalStep(result.data.total);   // 총 걸음수
                    setCarbonReduction(result.data.carbonReduction);  // 탄소 감소량
                } else {
                    console.error(result.message);
                }
            } catch (error) {
                console.error('Error fetching step data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStepData();
    }, []);

    const stepRef = useRef(todayStep);
    const [lastStepCount, setLastStepCount] = useState(0);

    useEffect(() => {
        const config = {
            default_threshold: 15.0,
            default_delay: 150000000,
            cheatInterval: 3000,
            onStepCountChange: (stepCount) => {
                if (stepCount > lastStepCount) {
                    setTodayStep(stepCount);
                    setLastStepCount(stepCount);
                }

                if (stepCount >= todayTargetStep) {
                    setWeekGoalYN(true);
                }
            },
            onCheat: () => {
                console.log("User is Cheating");
            }
        };

        startCounter(config);

        return () => { stopCounter(); };
    }, [lastStepCount]);

    useEffect(() => {
        const fetchUpdateSteps = async (steps) => {
            try {
                const accessToken = await AsyncStorage.getItem('token');
                const stepsInt = parseInt(steps, 10);
                const response = await fetch(`${apiUrl}/steps/update?steps=60000`, {
                    method: 'PATCH',
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
                    const summaryResponse = await fetch(`${apiUrl}/steps/summary?timestamp=${new Date().getTime()}`, {
                        method: 'GET',
                        headers: {
                            "Cache-Control": 'no-store',
                            "Content-Type": "application/json",
                            access: `${accessToken}`,
                        },
                    });

                    const summaryResult = await summaryResponse.json();

                    if (summaryResult.success) {
                        setTodayStep(summaryResult.data.today);
                        setWeekStep(summaryResult.data.week);
                        setTotalStep(summaryResult.data.total);
                        setCarbonReduction(summaryResult.data.carbonReduction);
                        confirmTargetStep();
                    }
                } else {
                    console.error(result.message);
                }
            } catch (error) {
                console.error('Error updating and fetching steps:', error);
            } finally {
                setLoading(false);
            }
        };

        if (todayStep > 0) {
            fetchUpdateSteps(todayStep);
        }
    }, [todayStep]);

    useEffect(() => {
        const fetchRewardState = async () => {
            try {
                const accessToken = await AsyncStorage.getItem('token');
                const response = await fetch(`${apiUrl}/steps/reward/state`, {
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
                    const { today, weekly } = result.data;
                    setTodayReward(today);  // 리워드 상태 업데이트
                    setWeekReward(weekly);
                } else {
                    console.error(result.message);
                }
            } catch (error) {
                console.error('Error fetching reward state:', error);
            }
        };

        fetchRewardState();
    }, [todayStep, weekStep]);

    const fetchTodayReward = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('token');
            const response = await fetch(`${apiUrl}/steps/reward/today`, {
                method: 'PATCH',
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
                console.log(result.message);
                setTodayReward(true);  // 리워드 지급 후 상태 변경
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error('Error fetching today reward:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeekReward = async () => {
        try {
            const accessToken = await AsyncStorage.getItem('token');
            const response = await fetch(`${apiUrl}/steps/reward/weekly`, {
                method: 'PATCH',
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
                console.log(result.message);
                setWeekReward(true);  // 리워드 지급 후 상태 변경
            } else {
                console.error(result.message);
            }
        } catch (error) {
            console.error('Error fetching week reward:', error);
        } finally {
            setLoading(false);
        }
    };

    const [opacityAnimation] = useState(new Animated.Value(1));

      useEffect(() => {
        const interval = setInterval(() => {
          Animated.sequence([
            Animated.timing(opacityAnimation, {
              toValue: 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnimation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start();
        }, 3000);

        return () => clearInterval(interval);  // 컴포넌트 언마운트 시 interval 정리
      }, [opacityAnimation]);

    return (
        <View style={styles.container}>
            <MainHeader />
            <View style={styles.topContainer}>
                <Text style={styles.GreenText}>{formattedDate}</Text>
                <Svg height="25" width="215">
                    <Defs>
                        <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#69E6A2" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#9BC9FE" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <SvgText
                        fill="url(#grad1)"
                        fontSize={getFontSize(18)}
                        fontWeight="800"
                        x="0"
                        y="20"
                    >오늘의 목표를 달성해보세요!</SvgText>
                </Svg>

                <Text style={[styles.SmallText, {marginTop: 15}]}>오늘 걸음수</Text>
                <Text style={styles.BoldLargeText}>{todayStep}</Text>

                <View style={styles.walkingContainer}>
                    <View style={styles.walkingIconContainer}>
                        <Image source={require('../../img/Pedometer/RunningGradient.png')} style={{width: 16.02, height: 14}}/>
                        { !todayGoalYN && (
                            <Image source={require('../../img/Pedometer/RunningGray.png')} style={{width: 19.02, height: 14}}/>
                        )}

                        {todayGoalYN && (
                            <View>
                                { !todayReward ? (
                                    <TouchableOpacity
                                        style={styles.GoalBubble}
                                        onPress={() => setTodayModalVisible(true)}
                                    >
                                        <Image source={require('../../img/Pedometer/Bubble.png')} style={[styles.BubbleIcon, {width: 51, height: 35}]}/>
                                        <Text style={styles.BubbleText}>클릭!</Text>
                                    </TouchableOpacity>
                                ) : null }
                                <Image source={require('../../img/Pedometer/GoalGradient.png')} style={[styles.runningIcon, {width: 29.82, height: 22}]}/>
                            </View>
                        )}

                    </View>

                    <View style={styles.walkingProcessorContainer}>
                        <View style={styles.processorBar}>
                            <LinearGradientBackground
                                colors={['rgb(155, 201, 254)', 'rgb(105, 230, 162)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressBar, {
                                    width: `${Math.min((todayStep / todayTargetStep) * 100, 100)}%`,
                                    borderRadius: 10,
                                }]}
                            />
                        </View>
                    </View>

                    <View style={styles.walkingNumberContainer}>
                        <Text style={styles.GreenText}>0</Text>
                        <View style={{flexDirection: 'row', alignItems: 'flex-end'}}>
                            <Text style={styles.GrayText}>목표 걸음 </Text>
                            <Text style={styles.GrayText}>{todayTargetStep}</Text>
                            <Text style={styles.GrayText}>보</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.bottomContainer}>
                {!weekGoalYN && (
                    <View style={styles.MenuBox}>
                        <Image source={require('../../img/Pedometer/CircleGreen.png')} style={styles.Icon} />
                        <View style={styles.stepContainer}>
                            <View style={{flexDirection: 'row'}}>
                                <Text style={styles.stepText}>{weekStep}</Text>
                                <Text style={styles.stepText}>걸음</Text>
                            </View>
                            <Text style={styles.SmallGrayText}>주간 걸음 수</Text>
                        </View>
                    </View>
                )}

                { weekGoalYN && (
                  <View>  {/* 최상위 View를 추가 */}
                    <Animated.View style={[styles.gradientContainer, { opacity: opacityAnimation }]}>
                      <LinearGradientBackground
                        colors={['rgb(155, 201, 254)', 'rgb(105, 230, 162)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 15 }}
                      >
                        <View style={styles.GoalMenuBox}>
                          <View style={{ flexDirection: 'row' }}>
                            <Image source={require('../../img/Pedometer/CircleWhite.png')} style={styles.Icon} />
                            <View style={styles.stepContainer}>
                              <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.stepText}>{weekStep}</Text>
                                <Text style={styles.stepText}>걸음</Text>
                              </View>
                              <Text style={styles.SmallWhiteText}>주간 목표 걸음 수 달성!</Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradientBackground>
                    </Animated.View>
                    {weekGoalYN && !weekReward && (
                        <View>
                            <TouchableOpacity
                              style={styles.GoalButton}
                              onPress={() => setWeekModalVisible(true)}
                            >
                              <Text style={styles.GoalButtonText}>클릭!</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                  </View>
                )}

                <View style={styles.MenuBox}>
                    <Image source={require('../../img/Pedometer/CircleGreen.png')} style={styles.Icon} />
                    <View style={styles.stepContainer}>
                        <View style={{flexDirection: 'row'}}>
                            <Text style={styles.stepText}>{totalStep}</Text>
                            <Text style={styles.stepText}>걸음</Text>
                        </View>
                        <Text style={styles.SmallGrayText}>누적 걸음 수</Text>
                    </View>
                </View>

                <View style={[styles.MenuBox, { height: 207, flexDirection: 'column',justifyContent: 'center', alignItems: 'flex-start' }]}>
                    <View style={{flexDirection: 'row'}}>
                        <Text style={styles.BoldSmallText}>걸어서 약 </Text>
                        <Text style={[styles.BoldSmallText, {color: colors.green}]}>{carbonReduction}</Text>
                        <Text style={[styles.BoldSmallText, {color: colors.green}]}>kg</Text>
                        <Text style={styles.BoldSmallText}>의</Text>
                    </View>
                    <Text style={styles.BoldSmallText}>탄소 배출량을 줄였어요!</Text>
                    <Text style={[styles.SmallGrayText, {lineHeight: 25}]}>자동차가 1km 가는데 약 200g의 탄소를 배출해요.</Text>
                    <View style={{alignSelf: 'center'}}>
                        <Image source={require('../../img/Home/GradientEarth.png')} style={[styles.earthIcon]}/>
                    </View>
                </View>
            </View>

            { weekModalVisible && weekGoalYN && !weekReward && (
              <Pressable style={styles.modalContainer} onPress={() => setWeekModalVisible(false)}>
                <Pressable style={styles.modalView} onPress={e => e.stopPropagation()}>
                    <View style={styles.rowContainer}>
                      <SeedIcon width={15} height={20} />
                      <Text style={styles.modalLargeText}>리워드 획득!</Text>
                      <SeedIcon width={15} height={20} />
                  </View>
                  <View style={styles.modalSmallTextContainer}>
                      <Text style={styles.modalSmallText}>주간 목표달성으로 열매 10개를</Text>
                      <Text style={styles.modalSmallText}>획득했어요!</Text>
                  </View>
                    <TouchableOpacity style={styles.modalButton} onPress={() => {
                        setWeekModalVisible(false);
                        fetchWeekReward();
                        }}>
                        <Text style={styles.modalButtonText}>확인</Text>
                    </TouchableOpacity>
                </Pressable>
              </Pressable>
            )}

            { todayModalVisible && todayGoalYN && !todayReward && (
              <Pressable style={styles.modalContainer} onPress={() => setTodayModalVisible(false)}>
                <Pressable style={styles.modalView} onPress={e => e.stopPropagation()}>
                    <View style={styles.rowContainer}>
                      <SeedIcon width={15} height={20} />
                      <Text style={styles.modalLargeText}>리워드 획득!</Text>
                      <SeedIcon width={15} height={20} />
                  </View>
                  <View style={styles.modalSmallTextContainer}>
                      <Text style={styles.modalSmallText}>일일 목표달성으로 열매 3개를</Text>
                      <Text style={styles.modalSmallText}>획득했어요!</Text>
                  </View>
                    <TouchableOpacity style={styles.modalButton} onPress={() => {
                        setTodayModalVisible(false);
                        fetchTodayReward();
                        }}>
                        <Text style={styles.modalButtonText}>확인</Text>
                    </TouchableOpacity>
                </Pressable>
              </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
    },
    topContainer:{
        flex: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
    },
    bottomContainer:{
        flex: 3,
        backgroundColor: colors.lightgray,
        paddingHorizontal: 16,
        justifyContent: 'space-evenly',
    },
    GreenText: {
        color: colors.green,
        fontSize: getFontSize(13),
        fontWeight: '400',
        lineHeight: 34,
    },
    walkingContainer:{
        width: '100%',
        paddingHorizontal: 23,
        alignItems: 'center',
    },
    walkingProcessorContainer: {
        marginHorizontal: 6,
        marginTop: 5,
        width: '100%',
        height: 13,
        borderRadius: 10,
        backgroundColor: colors.lightgray,
    },
    processorBar: {
        flex: 1,
        height: '100%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 10,
    },
    walkingIconContainer:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    walkingNumberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    GrayText: {
        color: colors.gray,
        fontSize: getFontSize(13),
        fontWeight: '400',
        lineHeight: 34,
    },
    BoldLargeText: {
        color: colors.black,
        fontSize: getFontSize(25),
        fontWeight: '800',
        lineHeight: 34,
    },
    SmallText: {
        color: colors.lightblack,
        fontSize: getFontSize(13),
        fontWeight: '400',
        lineHeight: 34,
    },
    MenuBox: {
        backgroundColor: colors.white,
        width: '100%',
        height: 91,
        borderRadius: 15,
        alignItems: 'center',
        flexDirection: 'row',
        paddingLeft: 26,
    },
    GoalMenuBox: {
        width: '100%',
        height: 91,
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 26,
        justifyContent: 'space-between'
    },
    Icon:{
        height: 36,
        width: 36,
        marginRight: 14,
    },
    stepContainer:{
        flexDirection: 'column',
    },
    stepText:{
        color: colors.lightblack,
        fontSize: getFontSize(15),
        fontWeight: '800',
        lineHeight: 20,
    },
    earthIcon:{
        height: 67,
        width: 98,
        marginTop: 14,
    },
    SmallGrayText: {
        color: colors.gray,
        fontSize: getFontSize(11),
        fontWeight: '400',
    },
    SmallWhiteText:{
        color: colors.white,
        fontSize: getFontSize(11),
        fontWeight: '400',
    },
    BoldSmallText: {
        color: colors.black,
        fontSize: getFontSize(18),
        fontWeight: '800',
        lineHeight: 22,
    },
    modalContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalView: {
        backgroundColor: colors.white,
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingVertical: 33,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 0,
            blur: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 5,
        width: 289,
        height: 269,
    },
    modalLargeText: {
        textAlign: 'center',
        fontSize: getFontSize(23),
        fontWeight: '800',
        color: colors.black,
        marginBottom: 10,
        paddingHorizontal: 13,
        paddingTop: 5,
    },
    modalSmallText: {
        textAlign: 'center',
        fontSize: getFontSize(15),
        fontWeight: '400',
        color: colors.lightblack,
        lineHeight: 22,
    },
    modalSmallTextContainer:{
        alignItems: 'center'
    },
    modalButton: {
        marginTop: 40,
        backgroundColor: colors.green,
        borderRadius: 15,
        paddingVertical: 10,
        elevation: 2,
        width: "100%",
    },
    modalButtonText: {
        color: colors.white,
        fontWeight: '400',
        textAlign: 'center',
        fontSize: getFontSize(18),
        lineHeight: 34,
    },
    GoalButton:{
        position: 'absolute',
        left: '85%',
        top: '50%',
        transform: [
            { translateX: -15 },
            { translateY: -57 },
        ],
        width: 51,
        height: 28,
        borderRadius: 15,
        backgroundColor: colors.white,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    GoalButtonText:{
        color: colors.black,
        fontSize: getFontSize(12),
        fontWeight: '800',
        lineHeight: 28,
        textAlign: 'center',
    },
    BubbleIcon:{
        position: 'absolute',
        width: 51,
        height: 35,
        bottom: 3,
    },
    BubbleText: {
        position: 'absolute',
        color: colors.black,
        fontSize: getFontSize(12),
        fontWeight: '800',
        lineHeight: 28,
        bottom: 10,
        left: 13
    }
})

export default PedometerScreen;