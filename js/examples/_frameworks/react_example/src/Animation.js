import React, { useRef, useEffect } from 'react';
import { Rive, Layout } from 'rive-js';

const Animation = ({ asset, animation, fit, alignment }) => {
    const canvas = useRef(null);
    const animationContainer = useRef(null);
    const rive = useRef(null);

    // Resizes the canvas to match the parent element
    useEffect(() => {
        
        let resizer = () => {
            const { width: w, height: h } =
                animationContainer.current.getBoundingClientRect();
            canvas.current.width = w;
            canvas.current.height = h;
        };
        resizer();
    });

    // Start the animation
    useEffect(() => {
        rive.current = new Rive({
            src: asset,
            canvas: canvas.current,
            animation: animation,
            layout: new Layout({fit: fit, alignment: alignment}),
            autoplay: true,
        });

        return () => rive.current.stop();
    });

    return (
        <div ref={animationContainer} className="Rive-logo">
            <canvas ref={canvas} />
        </div>
    );
};

export default Animation;