import { RiveFile, EventType, RuntimeLoader } from '../src/rive';
import { pingPongRiveFileBuffer, corruptRiveFileBuffer } from "./assets/bytes";


describe('RiveFile', () => {
    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('RiveFile initializes correctly with buffer', async () => {
        const onLoadMock = jest.fn();
        const onLoadErrorMock = jest.fn();

        const file = new RiveFile({
            buffer: pingPongRiveFileBuffer,
            onLoad: onLoadMock,
            onLoadError: onLoadErrorMock
        });


        await file.init();

        expect(onLoadMock).toHaveBeenCalled();
        expect(onLoadErrorMock).not.toHaveBeenCalled();
    });

    test('RiveFile initializes correctly with src', async () => {
        const mockSrc = 'http://example.com/file.riv';
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve({
                arrayBuffer: () => Promise.resolve(pingPongRiveFileBuffer),
            })
        );

        global.Request = jest.fn().mockImplementation((url) => ({
            url,
        })) as any;

        const onLoadMock = jest.fn();
        const onLoadErrorMock = jest.fn();

        const file = new RiveFile({
            src: mockSrc,
            onLoad: onLoadMock,
            onLoadError: onLoadErrorMock,
        });

        await file.init();

        expect(onLoadMock).toHaveBeenCalled();
        expect(onLoadErrorMock).not.toHaveBeenCalled();
    });

    test('RiveFile fires load error event for corrupt file', async () => {
        const onLoadErrorMock = jest.fn();
        const onLoadSuccessMock = jest.fn();
        const file = new RiveFile({
            buffer: corruptRiveFileBuffer,
            onLoadError: onLoadErrorMock,
            onLoad: onLoadSuccessMock,
        });

        try {
            await file.init();
        } catch (error) {
            // Error is expected to be handled by the onLoadError callback
        }

        expect(onLoadErrorMock).toHaveBeenCalled();
        expect(onLoadSuccessMock).not.toHaveBeenCalled();
    });

    test('RiveFile fires load error event when neither src nor buffer is provided', async () => {
        const onLoadErrorParamMock = jest.fn();
        const file = new RiveFile({
            onLoadError: onLoadErrorParamMock,
        });
        try {
            await file.init();
        } catch (error) {
            // Error is expected to be handled by the onLoadError callback
        }

        expect(onLoadErrorParamMock).toHaveBeenCalled();



    });

    test('RiveFile event listeners can be added and removed', async () => {
        const file = new RiveFile({ buffer: pingPongRiveFileBuffer });
        const mockCallback = jest.fn();

        file.on(EventType.Load, mockCallback);
        try {
            await file.init();
        } catch (error) {
            // Error is expected to be handled by the onLoadError callback
        }

        expect(mockCallback).toHaveBeenCalled();

        file.off(EventType.Load, mockCallback);
        file.removeAllRiveEventListeners();

        // We trigger another load event (this is just for testing purposes)
        (file as any).eventManager.fire({ type: EventType.Load, data: file });
        expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    test('RiveFile getInstance returns file instance if valid file is loaded', async () => {
        const file = new RiveFile({ buffer: pingPongRiveFileBuffer });
        await file.init();
        const instance = file.getInstance();
        expect(instance).toBeDefined();
    });


    test('RiveFile getInstance returns undefined if init() is not called', () => {
        const file = new RiveFile({ buffer: pingPongRiveFileBuffer });
        const instance = file.getInstance();
        expect(instance).toBeUndefined();
    });

    test('RiveFile cleanup decreases reference count', async () => {
        const file = new RiveFile({ buffer: pingPongRiveFileBuffer });
        await file.init();
        const instance = file.getInstance();
        expect(instance).toBeDefined();
        expect((file as any).referenceCount).toBe(1);
        file.cleanup();
        expect((file as any).referenceCount).toBe(0);
    });

    test('RiveFile catches unexpected errors during init()', async () => {
        // We mock RuntimeLoader to throw an unexpected error
        jest.spyOn(RuntimeLoader, 'awaitInstance').mockImplementation(() => {
            throw new Error('Unexpected runtime error');
        });

        const onLoadMock = jest.fn();
        const onLoadErrorMock = jest.fn();

        const file = new RiveFile({
            buffer: pingPongRiveFileBuffer,
            onLoad: onLoadMock,
            onLoadError: onLoadErrorMock
        });

        try {
            await file.init();
        } catch (error) {
            // Error is expected to be handled by the onLoadError callback
        }

        expect(onLoadErrorMock).toHaveBeenCalled();
        expect(onLoadMock).not.toHaveBeenCalled();

    });

});