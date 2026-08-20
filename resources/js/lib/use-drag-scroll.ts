import { useRef } from 'react';
import type {
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
} from 'react';

/**
 * Lets a scroll container be dragged with a mouse, the way a carousel can be.
 *
 * It moves the element's own `scrollLeft` rather than transforming a track, so
 * anything reading the scroll position still works — `scroll-fade-x` is driven
 * by a scroll timeline, and would see nothing at all if the drag faked the
 * movement with a transform.
 *
 * Only mouse pointers are taken over. Touch and pen already scroll natively,
 * with momentum and rubber-banding that no handler here could match.
 */
export function useDragScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const drag = useRef({
        active: false,
        startX: 0,
        startScrollLeft: 0,
        moved: false,
    });

    const onPointerDown = (event: ReactPointerEvent<T>): void => {
        const element = ref.current;

        if (element === null || event.pointerType !== 'mouse') {
            return;
        }

        drag.current = {
            active: true,
            startX: event.clientX,
            startScrollLeft: element.scrollLeft,
            moved: false,
        };

        element.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: ReactPointerEvent<T>): void => {
        const element = ref.current;

        if (element === null || !drag.current.active) {
            return;
        }

        const travelled = event.clientX - drag.current.startX;

        // A few pixels of slop, so a slightly shaky click is still a click.
        if (Math.abs(travelled) > 3) {
            drag.current.moved = true;
        }

        element.scrollLeft = drag.current.startScrollLeft - travelled;
    };

    const endDrag = (event: ReactPointerEvent<T>): void => {
        const element = ref.current;

        if (element === null || !drag.current.active) {
            return;
        }

        drag.current.active = false;

        if (element.hasPointerCapture(event.pointerId)) {
            element.releasePointerCapture(event.pointerId);
        }
    };

    /**
     * Swallow the click that ends a drag, so letting go on top of something
     * doesn't also press it.
     */
    const onClickCapture = (event: ReactMouseEvent<T>): void => {
        if (!drag.current.moved) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        drag.current.moved = false;
    };

    return {
        ref,
        dragHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onClickCapture,
        },
    };
}
