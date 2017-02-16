# encoding: utf-8

##
# This file is auto-generated. DO NOT EDIT!
#
require 'protobuf/message'

module Questionanswer

  ##
  # Message Classes
  #
  class QuestionAnswer < ::Protobuf::Message; end


  ##
  # Message Fields
  #
  class QuestionAnswer
    optional :string, :question, 1
    optional :string, :answer1, 2
    optional :string, :answer2, 3
    optional ::Questionanswer::QuestionAnswer, :next_q1, 4
    optional ::Questionanswer::QuestionAnswer, :next_q2, 5
    optional :string, :animal, 6
  end

end
