const {Wechaty, Contact, log, Message, FriendRequest} = require('wechaty');
const qrcodeTerminal = require('qrcode-terminal');
const axios = require("axios");

const fs = require('fs');
const path = require('path');
const { FileBox } = require('file-box');
const replyImg = path.resolve(__dirname, './activity.png');

var myName = '@币8-瑶瑶 ';
var regExpName = new RegExp(myName);

var replyMessageUrl = 'https://weixin.diyli.cn/wechat/chrome/message';
var replyTextWord1 = '1.【加号奖励】感谢你与币8建立沟通链接，送一份数据资料（下方图片），聊表心意。';
var replyTextWord2 = '2.【私聊/群聊查询】发送：BTC，ETH，EOS等数字货币代号查看实时行情。';
var replyTextWord3 = '3.【拉群奖励】拉本号进一个币圈群的小伙伴，我将拉你进入币8内部群，群里有已实战翻多倍的大牛和专门的数据团队为你提供专业数据分析服务。';

const Robot = Wechaty.instance();
Robot
    .on('scan', (url, code) => {
        if (!/201|200/.test(String(code))){
            let loginUrl = url.replace(/\/qrcode\//, '/l/');
            qrcodeTerminal.generate(loginUrl, );
        }
    })
    .on('login', user => {
        log.info('Robot', `${user.name()} login`)
    })
    .on('friend', async request => {
        let textWord = replyTextWord1 + '\n\n' + replyTextWord2 + '\n\n' + replyTextWord3;
        const contact = request.contact();
        try {
            switch (request.type()) {
                case FriendRequest.Type.Receive:
                case FriendRequest.Type.Confirm:
                    request.accept();
                    textWord = replyTextWord1 + '\n\n' + replyTextWord2 + '\n\n' + replyTextWord3;
                    break;
            }
        } catch (e) {
            console.log('好友变化:', e.message)
        }
        await contact.say(textWord);
        const fileBox = FileBox.packStream(
            fs.createReadStream(replyImg),
            replyImg,
        );
        await contact.say(fileBox);
    })
    .on('message', async msg => {
        try {

            /* 如果是自己发的 跳过 */
            if(msg.self()){
                return;
            }

            /* 如果不是文字信息 跳过 */
            if (msg.type() !== Message.Type.Text) {
                return;
            }

            /* 如果不是文字太长 跳过 */
            if(msg.text().length > 15) {
                return;
            }

            /* 只允许0-10个英文字母 */
            var wordExp = new RegExp(/^[a-zA-Z]{1,10}$/);
            var word = msg.text().replace(regExpName, '');
            if(!wordExp.test(word)) {
                return;
            }

            const contact = msg.from();
            const content = msg.text();
            const room = msg.room();

            if(room){
                console.log(`Room: ${room.topic()} Contact: ${contact.name()} msgType: ${msg.type()} Content: ${content}`)
            } else{
                console.log(`Contact: ${contact.name()} msgType: ${msg.type()} Content: ${content}`)
            }

            axios.get(replyMessageUrl, {
                params : { //请求参数
                    content : content.replace(regExpName, ''),
                    nickName: contact.name(),
                    at: content.indexOf(myName) > -1 ? 1 : 0
                }
            }).then(response => {
                const result = response.data;
                if(result.code == 200){
                    log.info('Robot', `\n${result.data}`);
                    msg.say(result.data);
                }
            }).catch(err => {
                log.error(err.code);
                console.log(err.config.params)
            });
        } catch (e) {
            log.error('Robot', 'start() fail: %s', e);
            Robot.stop();
            process.exit(-1);
        }
    })
    .start();
