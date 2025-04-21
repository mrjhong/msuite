jest.mock('react-datepicker', () => {
    const OriginalModule = jest.requireActual('react-datepicker');
    return {
      ...OriginalModule,
      __esModule: true,
    };
  });