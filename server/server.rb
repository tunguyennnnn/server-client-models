require 'webrick'
require 'json'
require 'protocol_buffers'


class QuestionAnswer < ProtocolBuffers::Message
  optional :string, :question, 1
  optional :string, :answer1, 2
  optional :string, :answer2, 3
  optional QuestionAnswer, :next_q1, 4
  optional QuestionAnswer, :next_q2, 5
  optional :string, :animal, 6
end


class AnimalGuessingServer < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(request, response)
    response.body = read_json_f('server/model.json')
    raise WEBrick::HTTPStatus::OK
  end
end

class AnimalGuessingServerJson < AnimalGuessingServer
  def read_json_f(file_name)
    file = File.read(file_name)
    JSON.generate(JSON.parse(file))
  end
end

class AnimalGuessingServerProtocolBuf < AnimalGuessingServer
  def read_json_f(file_name)
    file = File.read(file_name)
    json_data = JSON.parse(file)
    build_struct(json_data, "root").serialize_to_string.bytes.to_s
  end

  def build_struct(json, node)
    answer = json[node]
    if answer.kind_of? String
      QuestionAnswer.new(animal: answer)
    else
      question, answer1, answer2  = answer
      QuestionAnswer.new(question: question, answer1: answer1, answer2: answer2 , next_q1: build_struct(json, answer1), next_q2: build_struct(json, answer2))
    end
  end
end

class AnimalGuessingServerMulti < AnimalGuessingServer

  def do_POST(request, response)
    file = File.read('server/model.json')
    json_data = JSON.parse(file)
    response["content-type"] = "text/html"
    response.body = build_single_struct(json_data, request.query["answer"]).serialize_to_string.bytes.to_s
  end

  def read_json_f(file_name)
    file = File.read(file_name)
    json_data = JSON.parse(file)
    build_single_struct(json_data, "root").serialize_to_string.bytes.to_s
  end

  def build_single_struct(json_data, node)
    answer = json_data[node]
    if answer.kind_of? String
      QuestionAnswer.new(animal: answer)
    else
      question, answer1, answer2  = answer
      QuestionAnswer.new(question: question, answer1: answer1, answer2: answer2)
    end
  end
end


def start_webrick(config = {})
  config.update(:Port => 12346)
  server = WEBrick::HTTPServer.new(config)
  yield server if block_given?
  ['INT', 'TERM'].each {|signal|
    trap(signal) {server.shutdown}
  }
  server.start
end

start_webrick ({DocumentRoot: 'client'}){ |server|
  server.mount '/animal_guessing_json', AnimalGuessingServerJson
  server.mount '/animal_guessing_pb', AnimalGuessingServerProtocolBuf
  server.mount '/animal_guessing_multi', AnimalGuessingServerMulti
}
