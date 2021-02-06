const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id})
          .select('-__v -password')
          .populate('bookCount')
          .populate('savedBooks');

          return userData;
      }
      throw new AuthenticationError('Not logged in');
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user};
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        const currentUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          {$push: {savedBooks: args}},
          {new: true}
        );
        return currentUser;
      }
    },
    removeBook: async (parent, {bookId}, context) => {
      if (context.user) {
        const currentUser = await User.findOneAndUpdate(
          {_id: context.user_id},
          {$pull: {savedBooks: {bookId}}},
          {new: true}
        );
        return currentUser;
      }
    }
  }
};

module.exports = resolvers;