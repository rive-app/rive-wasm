import React, { useRef, useEffect } from 'react';
import { Rive, Layout } from 'rive-js';
// import styles from './App.css';

const Animation = ({ asset, animation, fit, alignment }) => {
    const canvas = useRef(null);
    const animationContainer = useRef(null);
    let rive = useRef(null);

    // Resizes the canvas to match the parent element
    useEffect(() => {
        const { width: w, height: h } = animationContainer.current.getBoundingClientRect();
        canvas.current.width = w;
        canvas.current.height = h;
    });

    // Start the animation
    useEffect(() => {
        rive.current = Rive.new({
            src: asset,
            canvas: canvas.current,
            animation: animation,
            layout: new Layout(fit, alignment),
            autoplay: true,
        });

        return () => rive.current.stop();
    });

    return (
        <div ref={animationContainer} className="App-logo">
            <canvas ref={canvas} />
        </div>
    );
};

export default Animation;