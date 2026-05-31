import { useEffect, useRef } from 'react';

const ProctoringHandler = ({ sessionId, interviewActive, onPasteDetected, stompClient }) => {
    const sessionIdRef = useRef(sessionId);
    const interviewActiveRef = useRef(interviewActive);
    const stompClientRef = useRef(stompClient);

    useEffect(() => { sessionIdRef.current = sessionId }, [sessionId]);
    useEffect(() => { interviewActiveRef.current = interviewActive }, [interviewActive]);
    useEffect(() => { stompClientRef.current = stompClient }, [stompClient]);

    const sendEvent = (eventType, details, extraData = {}) => {
        if (!sessionIdRef.current || !interviewActiveRef.current) return;
        if (!stompClientRef.current || !stompClientRef.current.connected) return;
        try {
            stompClientRef.current.publish({
                destination: '/app/proctoring-event',
                body: JSON.stringify({
                    sessionId: sessionIdRef.current,
                    eventType,
                    details,
                    timestamp: new Date().toISOString(),
                    ...extraData
                })
            });
        } catch (e) {}
    };

    useEffect(() => {
        const handlePaste = (e) => {
            if (!interviewActiveRef.current) return;
            const target = e.target;
            const isAnswerField = target.tagName === 'TEXTAREA' ||
                                 (target.tagName === 'INPUT' && target.type === 'text');
            if (isAnswerField) {
                const pastedText = e.clipboardData?.getData('text') || '';
                if (pastedText) {
                    sendEvent('PASTE_DETECTED', 'Candidate pasted text', {
                        pastedText: pastedText.substring(0, 200)
                    });
                    onPasteDetected?.(pastedText);
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    useEffect(() => {
        const handleBlur = () => sendEvent('WINDOW_BLUR', 'Window lost focus');
        const handleVisibilityChange = () => {
            if (document.hidden) sendEvent('TAB_SWITCH', 'Switched to another tab');
        };
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
};

export default ProctoringHandler;