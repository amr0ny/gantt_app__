interact('.js-resizable')
  .resizable({
    edges: { top: false, left: false, bottom: false, right: true },
    listeners: {
      move: function (event) {
        let { x, y } = event.target.dataset;

        x = (parseFloat(x) || 0) + event.deltaRect.left;

        Object.assign(event.target.style, {
          width: `${event.rect.width}px`,
          transform: `translate(${x}px, ${y}px)`
        });

        Object.assign(event.target.dataset, { x, y });
      }
    }
  });
