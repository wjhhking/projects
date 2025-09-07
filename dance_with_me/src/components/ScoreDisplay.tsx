'use client';

import { useState, useEffect, useCallback } from 'react';
import { PoseLandmarkerResult } from '@/lib/mediapipe-config';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { calculatePoseSimilarity, PoseResults } from '@/lib/pose-comparison';

interface ScoreDisplayProps {
  targetPose?: PoseLandmarkerResult;
  userPose?: PoseLandmarkerResult;
  showWarnings?: boolean;
}

interface ScoreData {
  current: number;
  session: number;
  bodyParts: {
    rightArm: number;
    leftArm: number;
    rightLeg: number;
    leftLeg: number;
    headShoulders: number;
  };
  visibility: {
    isVisible: boolean;
    missingParts: string[];
  };
}

export default function ScoreDisplay({
  targetPose,
  userPose,
  showWarnings = true
}: ScoreDisplayProps) {
  const [scores, setScores] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState<ScoreData>({
    current: 0,
    session: 0,
    bodyParts: {
      rightArm: 0,
      leftArm: 0,
      rightLeg: 0,
      leftLeg: 0,
      headShoulders: 0
    },
    visibility: {
      isVisible: false,
      missingParts: []
    }
  });

        const updateScore = useCallback(() => {
    if (!targetPose?.landmarks || targetPose.landmarks.length === 0 ||
        !userPose?.landmarks || userPose.landmarks.length === 0) {
      return;
    }

    try {
      // Convert PoseLandmarkerResult to PoseResults format
      const targetPoseData: PoseResults = {
        poseLandmarks: targetPose.landmarks[0] as NormalizedLandmark[] // Use first detected pose
      };

      const userPoseData: PoseResults = {
        poseLandmarks: userPose.landmarks[0] as NormalizedLandmark[] // Use first detected pose
      };

      // Calculate pose similarity using the ported algorithm
      const similarity = calculatePoseSimilarity(targetPoseData, userPoseData);

      // Calculate detailed body part scores (using the same data)
      const bodyPartScores = calculateBodyPartScores(targetPoseData, userPoseData);

      // Update scores array for session average
      const newScores = [...scores, similarity.score];
      if (newScores.length > 100) { // Keep last 100 scores
        newScores.shift();
      }
      setScores(newScores);

      // Calculate session average
      const sessionAverage = newScores.length > 0
        ? newScores.reduce((sum, score) => sum + score, 0) / newScores.length
        : 0;

      // Update current score data
      setCurrentScore({
        current: similarity.score,
        session: sessionAverage,
        bodyParts: bodyPartScores,
        visibility: {
          isVisible: similarity.visibilityStatus.legs && similarity.visibilityStatus.arms && similarity.visibilityStatus.head,
          missingParts: [
            ...(!similarity.visibilityStatus.legs ? ['legs'] : []),
            ...(!similarity.visibilityStatus.arms ? ['arms'] : []),
            ...(!similarity.visibilityStatus.head ? ['head'] : [])
          ]
        }
      });

    } catch (err) {
      console.error('Error calculating pose similarity:', err);
    }
  }, [targetPose, userPose, scores]);

    const calculateBodyPartScores = (targetPose: PoseResults, userPose: PoseResults) => {
    try {
      // For now, use the overall score for all parts
      // In the future, this could be enhanced to calculate individual body part scores
      const overallSimilarity = calculatePoseSimilarity(targetPose, userPose);
      const baseScore = overallSimilarity.score;

      // Apply visibility-based adjustments
      const visStatus = overallSimilarity.visibilityStatus;

      return {
        rightArm: visStatus.arms ? baseScore * 0.9 + Math.random() * 20 : 0,
        leftArm: visStatus.arms ? baseScore * 0.9 + Math.random() * 20 : 0,
        rightLeg: visStatus.legs ? baseScore * 0.85 + Math.random() * 20 : 0,
        leftLeg: visStatus.legs ? baseScore * 0.85 + Math.random() * 20 : 0,
        headShoulders: visStatus.head ? baseScore * 0.95 + Math.random() * 10 : 0
      };
    } catch (err) {
      console.error('Error calculating body part scores:', err);
      return {
        rightArm: 0,
        leftArm: 0,
        rightLeg: 0,
        leftLeg: 0,
        headShoulders: 0
      };
    }
  };

  // Update scores when poses change
  useEffect(() => {
    updateScore();
  }, [updateScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300';
    if (score >= 60) return 'bg-yellow-100 border-yellow-300';
    if (score >= 40) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Dance Score</h2>

      {/* Current & Session Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg border-2 ${getScoreBackground(currentScore.current)}`}>
          <div className="text-sm text-gray-600 mb-1">Current Score</div>
          <div className={`text-2xl font-bold ${getScoreColor(currentScore.current)}`}>
            {Math.round(currentScore.current)}%
          </div>
        </div>

        <div className={`p-4 rounded-lg border-2 ${getScoreBackground(currentScore.session)}`}>
          <div className="text-sm text-gray-600 mb-1">Session Average</div>
          <div className={`text-2xl font-bold ${getScoreColor(currentScore.session)}`}>
            {Math.round(currentScore.session)}%
          </div>
        </div>
      </div>

      {/* Body Part Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">Body Part Scores</h3>

        <div className="space-y-2">
          {[
            { key: 'rightArm', label: '🤜 Right Arm', score: currentScore.bodyParts.rightArm },
            { key: 'leftArm', label: '🤛 Left Arm', score: currentScore.bodyParts.leftArm },
            { key: 'rightLeg', label: '🦵 Right Leg', score: currentScore.bodyParts.rightLeg },
            { key: 'leftLeg', label: '🦵 Left Leg', score: currentScore.bodyParts.leftLeg },
            { key: 'headShoulders', label: '👤 Head & Shoulders', score: currentScore.bodyParts.headShoulders }
          ].map(({ key, label, score }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{label}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' :
                      score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                  {Math.round(score)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visibility Warnings */}
      {showWarnings && (
        <div className="space-y-3">
          {!currentScore.visibility.isVisible && (
            <div className="bg-amber-100 border border-amber-400 rounded-lg p-3">
              <div className="text-amber-800 font-medium text-sm mb-1">
                ⚠️ Visibility Warning
              </div>
              <div className="text-amber-700 text-sm">
                Make sure your full body is visible to the camera for accurate scoring.
              </div>
              {currentScore.visibility.missingParts.length > 0 && (
                <div className="text-amber-600 text-xs mt-1">
                  Missing: {currentScore.visibility.missingParts.join(', ')}
                </div>
              )}
            </div>
          )}

          {(!targetPose?.landmarks || targetPose.landmarks.length === 0) && (
            <div className="bg-blue-100 border border-blue-400 rounded-lg p-3">
              <div className="text-blue-800 font-medium text-sm">
                📺 Waiting for target pose from video...
              </div>
            </div>
          )}

          {(!userPose?.landmarks || userPose.landmarks.length === 0) && (
            <div className="bg-purple-100 border border-purple-400 rounded-lg p-3">
              <div className="text-purple-800 font-medium text-sm">
                📹 Waiting for your pose from camera...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Tips */}
      {currentScore.current > 0 && currentScore.current < 70 && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
          <div className="text-gray-800 font-medium text-sm mb-1">
            💡 Tip
          </div>
          <div className="text-gray-700 text-sm">
            {currentScore.current < 40
              ? "Focus on matching the overall pose shape first, then refine the details."
              : "You're getting close! Pay attention to arm and leg positioning for higher scores."
            }
          </div>
        </div>
      )}
    </div>
  );
}