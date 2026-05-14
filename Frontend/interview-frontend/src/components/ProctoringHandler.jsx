import { useEffect } from 'react';

const ProctoringHandler = ({ sessionId, interviewActive, onPasteDetected, stompClient }) => {
    
    // Send event silently - no errors, no blocking
    const sendEvent = (eventType, details, extraData = {}) => {
        if (!sessionId || !interviewActive) return;
        if (!stompClient || !stompClient.connected) return;
        
        try {
            stompClient.publish({
                destination: '/app/proctoring-event',
                body: JSON.stringify({
                    sessionId: sessionId,
                    eventType: eventType,
                    details: details,
                    timestamp: new Date().toISOString(),
                    ...extraData
                })
            });
        } catch (e) {
            // Complete silence - never break the interview
        }
    };

    // Detect PASTE only - most important feature
    useEffect(() => {
        const handlePaste = (e) => {
            if (!interviewActive) return;
            
            const target = e.target;
            const isAnswerField = target.tagName === 'TEXTAREA' || 
                                 (target.tagName === 'INPUT' && target.type === 'text');
            
            if (isAnswerField) {
                const pastedText = e.clipboardData?.getData('text') || '';
                if (pastedText) {
                    sendEvent('PASTE_DETECTED', 'Candidate pasted text', {
                        pastedText: pastedText.substring(0, 200)
                    });
                }
            }
        };
        
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [interviewActive, onPasteDetected, stompClient]);

    // Detect Alt+Tab and tab switching - JUST DETECT, never block
    useEffect(() => {
        const handleBlur = () => {
            if (interviewActive) {
                sendEvent('WINDOW_BLUR', 'Window lost focus');
            }
        };
        
        const handleVisibilityChange = () => {
            if (interviewActive) {
                if (document.hidden) {
                    sendEvent('TAB_SWITCH', 'Switched to another tab');
                }
            }
        };
        
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [interviewActive, stompClient]);

    return null;
};

export default ProctoringHandler;