const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User
                .findOne({ _id: context.user._id })
                .select("-__V -password")
                .populate('books');

                return userData;
            };
            throw new AuthenticationError('You are not logged in.');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError("Login info is incorrect.");
            };

            const correctPassword = await user.isCorrectPassword(password);
            if (!correctPassword) {
                throw new AuthenticationError("Login info is incorrect.");
            };

            const token =signToken(user);
            return { token, user };

        },

        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updateUser = await User
                .findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: bookData } },
                    { new: true },
                )
                .populate('books');
                return updateUser;
            };
            throw new AuthenticationError("You need to be logged in to save books.");
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true },
                );
                return updatedUser;
            };
            throw new AuthenticationError("You need to be logged in to delete books.")
        }
    },
};

module.exports = resolvers;