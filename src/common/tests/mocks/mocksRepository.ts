export const MockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

export const MockDataSource = {
  transaction: jest.fn().mockImplementation(cb => cb({
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  })),
};
