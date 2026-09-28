/**
 * hooks/useAppDispatch.js + useAppSelector.js
 * Typed Redux hooks (JS version — no TypeScript inference but consistent pattern).
 */
import { useDispatch, useSelector } from 'react-redux';

/** @returns {import('@/app/store').AppDispatch} */
export const useAppDispatch = () => useDispatch();

/** @template T @param {(state: import('@/app/store').RootState) => T} selector @returns {T} */
export const useAppSelector = (selector) => useSelector(selector);
