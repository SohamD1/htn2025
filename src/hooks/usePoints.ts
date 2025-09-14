import { useState, useEffect } from 'react';
import pointsService from '../services/points-service';
import { useAuth } from '../contexts/AuthContext';

export const usePoints = () => {
  const { currentClient } = useAuth();
  const [points, setPoints] = useState<number>(0);

  // Update points service when current client changes
  useEffect(() => {
    const clientId = currentClient?.id || null;
    pointsService.setCurrentClient(clientId);
    setPoints(pointsService.getTotalPoints());
  }, [currentClient]);

  useEffect(() => {
    const unsubscribe = pointsService.subscribe((newPoints: number) => {
      setPoints(newPoints);
    });

    return unsubscribe;
  }, []);

  const addPoints = (amount: number): number => {
    return pointsService.addPoints(amount);
  };

  const subtractPoints = (amount: number): number => {
    return pointsService.subtractPoints(amount);
  };

  const hasEnoughPoints = (requiredAmount: number): boolean => {
    return pointsService.hasEnoughPoints(requiredAmount);
  };

  const resetPoints = (): void => {
    pointsService.resetPoints();
  };

  return {
    points,
    addPoints,
    subtractPoints,
    hasEnoughPoints,
    resetPoints
  };
};

export default usePoints;
