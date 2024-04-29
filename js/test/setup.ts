window.AudioContext = jest.fn().mockImplementation(() => {
    return {}
});
window.ResizeObserver = jest.fn().mockImplementation(() => {
    return {
        observe: () => {},
        unobserve: () => {},
    }
});