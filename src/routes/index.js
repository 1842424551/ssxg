var express = require('express');
var bcryptNodejs = require('bcrypt-nodejs');
var hash = function(password){
  return bcryptNodejs.hashSync(password, bcryptNodejs.genSaltSync(10), null);
};
var mongoose = require('mongoose');
var Club = require('../models/club.js').club;
var Activity = require('../models/club.js').activity;
var User = mongoose.model('User');
// var Activity = mongoose.model('Activity');



var router = express.Router();

var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

module.exports = function(passport) {

  /*
  获取注册页面
  */ 
 //添加注册错误提示
  router.get('/signup', function (req, res) {
    res.render('signup', {
      message: req.flash('message')
    });
  });


  /*
  发送注册信息, 成功后跳转到活动浏览页面
  */
  router.post('/signup',
    passport.authenticate('signup',{failureRedirect: '/signup'}), function (req, res) {
      res.redirect('/');
  });

  /* 
  获取登录界面
  */
 //显示错误信息
  router.get('/login', function (req, res) {
    res.render('login', {
      user: req.user,
      message: req.flash('message')
    });
  });


  /*
  发送登录信息，如果是管理员帐号则跳转到社团管理页面
  否则到活动浏览页面
  */
 //登陆错误，显示错误信息，回到登陆界面
  router.post('/login',
    passport.authenticate('login', {failureRedirect: '/login'}), function (req, res) {
      // req.user.identity === 'common_user' ? res.redirect('/') : res.redirect('/club/' + req.user.identity + '/manage');
      if (req.user.identity === 'common_user') {
        res.redirect('/')
      }
      else if (req.user.identity === 'system_manager') {
        res.redirect('/admin')
      } else {
        res.redirect('/club/' + req.user.identity + '/clubmanage')
      }
  });

  /* 用户登出 */
  router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  /*
  获取活动浏览页面，也是首页，游客可进
  数据请求:
  1.homepage.jade
  2.req.user
  3.所有的活动的_id,名字,图片,举办时间,点赞数

  ////////说明: 这里有个问题没想好,怎样判断已登录用户对一个活动是否点过赞,不知师兄有没有什么好的想法
  ////////回答：先不想那部分了， 先把它做的能运行再迭代
  */
  router.get('/', function(req, res) {
    Activity.find({}, function(err, activities) {
      var all_activities = [];
      for (var i = 0; i < activities.length; i++) {
        var activity_info = {};
        activity_info['_id'] = activities[i]._id;
        activity_info['name'] = activities[i].name;
        activity_info['logo'] = activities[i].logo;
        activity_info['time'] = activities[i].time.toString();
        all_activities.push(activity_info);
      }
      if (err) console.log(err);
      else {
        res.render('homepage', {
          user:req.user,
          content_list:all_activities
        });
      }
    });
  });


  /*
  获取活动详情页面, 游客可进
  数据发送:
  活动的_id

  数据请求:
  1.eventDetail.jade
  2.req.user
  3.该活动的名字,时间,地点,类型,主办社团的名字,主办社团的_id,标签,报名人数,点赞数,评论数,活动详情描述
  4.该活动的所有评论(包括管理员的回复)

  ////////说明: 1.目前标签只有"公益时"和"体育章"两种
               2.目前考虑每个人可以发评论,但只有管理员能回复评论回复而且每条评论只能有一条回复
  */
  router.get('/activity/:act_id', function(req, res) {
    Activity.findOne({_id: req.params.act_id}, function(err, activity) {
      if (err) console.log(err);
      else {
        Club.findOne({_id: activity.club_id}, function(err, club) {
          if (err) console.log(err);
          else {
            res.render('eventDetail', {
              user: req.user,
              name: activity.name,
              time: activity.time.toString(),
              location: activity.location,
              logo: activity.logo,
              type: activity.type,
              club_name: club.name,
              club_id: activity.club_id,
              tag: activity.tag,
            });
          }
        })
      }
    });
  });


  /*
  获取社团浏览页面，游客可进

  数据请求:
  1.clubHome.jade
  2.req.user
  3.所有的社团的_id,名字,图片,该社团所有活动的总点赞数
  */
  router.get('/club', function(req, res) {
    Club.find({}, function(err, clubs) {
      var all_clubs = [];
      for (var i = 0; i < clubs.length; i++) {
        var club_info = {};
        club_info['_id'] = clubs[i]._id;
        club_info['name'] = clubs[i].name;
        club_info['logo'] = clubs[i].logo;
        all_clubs.push(club_info);
      }
      if (err) console.log(err);
      else {
        res.render('clubHome', {
          user:req.user,
          content_list:all_clubs
        });
      }
    });
  });


  /*
  获取社团详情页面，游客可进

  数据发送:
  社团的_id

  数据请求:
  1.clubDetail.jade
  2.req.user
  3.该社团的名字, 描述, logo
  4.该社团所有活动的_id, 名字, 举办时间, 点赞数目
  */
  router.get('/club/:club_id', function(req, res) {
    // body...
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      if (err) console.log(err);
      else {
        res.render('clubDetail', {
          club:club
        });
      }
    });
  });


  /*
  获取社团管理页面，只有该社团管理员可进

  数据发送:
  社团的_id

  数据请求:
  1.clubManage.jade
  2.req.user
  3.该社团的_id,名字,描述,logo
  */
  router.get('/club/:club_id/clubmanage', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      res.render('clubManage', {
        user: req.user,
        club_id: club._id,
        name: club.name,
        description: club.description,
        logo: club.logo
      });
    });
  });


  /*
  获取活动发布页面， 只有该社团管理员可进

  数据发送:
  社团的_id

  数据请求:
  1.newEvent.jade
  2.req.user
  3.该社团的_id, 名字, logo
  */
  router.get('/club/:club_id/newevent', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      res.render('newEvent', {
        user: req.user,
        club_id: club._id,
        name: club.name,
        logo: club.logo
      });
    });
  });


  /*
  发送要发布的活动信息, 只有该社团管理员可进

  数据发送:
  1.社团的_id
  2.新活动的名字,时间,地点,类型,标签,图片,描述
  */

  router.post('/club/:club_id/newevent', function(req, res) {
    console.log(req.files['logo']);
    var activity = new Activity({
      name : req.param('newEventName'),
      time : req.param('newEventTime'),
      location : req.param('newEventPlace'),
      type : req.param('newEventType'),
      tag : req.param('newEventTag'),
      logo: '/'+req.files['logo'].name,
      detail_discription: req.param('newEventSummary'),
      club_id: req.params.club_id
    });
    console.log(activity);
    activity.save(function(err) {
      if (err) console.log(err);
    });
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      club.activity.push(activity);
      club.save(function(err) {
        if (err) console.log(err);
        else res.redirect('/club/'+req.params.club_id+'/clubmanage')
      });
    });
  });


  /*
  显示该社团收到的所有评论

  数据发送:
  社团的_id

  数据请求:
  1.clubComment.jade
  2.req.user
  3.该社团的_id, 名字, logo
  */

  // 李健华：  这里有问题
  router.get('/club/:club_id/clubcomment', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      res.render('clubComment', {
        user: req.user,
        club_id: club._id,
        name: club.name,
        logo: club.logo
      });
    });
  });


  /*
  显示该社团的所有活动, 管理员可进

  数据发送:
  社团的_id

  数据请求:
  1.manageEvent.jade
  2.req.user
  3.该社团的_id, 名字, logo
  4.该社团所有活动的_id, 名字, 时间, 点赞数, logo
  */

  router.get('/club/:club_id/manageevent', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      var ids = new Array();
      var names = new Array();
      var times = new Array();
      var likedNumber = new Array();
      for (var i = 0; i < club.activity.length; i++) {
        ids.push(club.activity[i]._id);
        names.push(club.activity[i].name);
        times.push(club.activity[i].time);
        likedNumber.push(club.activity[i].likedPerson.length);
      }
      if (err) console.log(err);
      else {
        res.render('manageEvent', {
          user: req.user,
          name: club.name,
          club_id: club._id,
          logo: club.logo,
          activity_id : ids,
          names: names,
          time: times,
          likedNumber: likedNumber
        });
      }
    });
  });


  /*
  获取修改已发布的活动页面,管理员可进

  数据发送:
  社团的_id
  活动的_id

  数据请求:
  1.specificManageEvent.jade
  2.req.user
  3.该社团的_id, 名字, logo
  3.该活动的_id, 名称, 时间, 类型, 标签, 描述
  */
  router.get('/club/:club_id/:act_id/specificmanageevent', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      for (var i = 0; i < club.activity.length; i++) {
        if (club.activity[i]._id == req.params.act_id) {
          res.render('specificManageEvent', {
            club_id: club._id,
            club_name: club.name,
            club_logo: club.logo,
            activity_id : club.activity[i]._id,
            activity_name : club.activity[i].name,
            activity_time : club.activity[i].time,
            activity_type : club.activity[i].type,
            activity_tag : club.activity[i].tag,
            activity_detail_description: club.activity[i].detal_discription
          });
        }
      }
    });
  });


  /*
  发送修改已发布的活动页面,管理员可进

  数据发送:
  1.社团的_id, 活动的_id
  2.活动的名称, 时间, 类型, 标签, 海报图片, 描述

  ////////说明:发送的信息可能为空,为空的不要修改
  */
  router.post('/club/:club_id/:act_id/specificmanageevent', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      if (err) console.log(err);
      else {
        for (var i = 0; i < club.activity.length; i++) {
          if (club.activity[i]._id == req.params.act_id) {
            club.activity[i].name = req.body.name ? req.body.name : club.activity[i].name;
            club.activity[i].time = req.body.time ? req.body.time : club.activity[i].time;
            club.activity[i].type = req.body.type ? req.body.type : club.activity[i].type;
            club.activity[i].tag = req.body.tag ? req.body.tag : club.activity[i].tag;
            club.activity[i].photos[0] = req.body.photos[0] ? req.body.photos[0] : club.activity[i].photos[0];
            club.activity[i].detal_discription = req.body.detal_discription ? req.body.detal_discription : club.activity[i].detal_discription;
          }
        }
      }
      club.save();
    });
    Activity.findOne({_id: req.params.act_id}, function(err, activity) {
      if (err) console.log(err);
      else {
        activity.name = req.body.name ? req.body.name : activity.name;
        activity.time = req.body.time ? req.body.time : activity.time;
        activity.type = req.body.type ? req.body.type : activity.type;
        activity.tag = req.body.tag ? req.body.tag : activity.tag;
        activity.photos[0] = req.body.photos[0] ? req.body.photos[0] : activity.photos[0];
        activity.detal_discription = req.body.detal_discription ? req.body.detal_discription : activity.detal_discription;
      }
      activity.save(function(err) {
        if (err) console.log(err);
        else {
          res.send("success!!");
        }
      });
    });
  });


  /*
  获取修改社团数据页面,管理员可进

  数据发送:
  社团的_id

  数据请求:
  1.modifyClubData.jade
  2.req.user
  3.社团的_id, 名字, logo
  */
  router.get('/club/:club_id/modifyclubdata', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      res.render('modifyClubData', {
        user: req.user,
        club_id: club._id,
        name: club.name,
        logo: club.logo
      });
    });
  });

  /*
  发送要修改的社团数据页面,管理员可进

  数据发送:
  1.社团的_id
  2.社团的logo, 社团的描述

  ////////说明:发送的信息可能是空的,先判断,如果为空则不修改
  */
  router.post('/club/:club_id/modifyclubdata', function(req, res) {
    Club.findOne({_id: req.params.club_id}, function(err, club) {
      club.logo = req.body.log ? req.body.logo : club.logo;
      club.description = req.body.description ? req.body.description : club.description;
      club.save(function(err) {
        if (err) console.log(err);
        else {
          res.send("success!!!");
        }
      });
    });
  });

  router.get('/admin', isAuthenticated, function(req, res) {
    res.render('admin', {
      user: req.user,
    })
  });

  router.post('/createclub', function(req, res) {
    console.log(req.files['logo']);
    Club.findOne({'name': req.param('name')}, function(error, club) {
      if (error) {
        var message = 'Database error.'
        console.log(message);
        return res.send(message);
      }
      if (club) {
        res.send('Already exists.')
      } else {
        var newClub = new Club({
          name: req.param('name'),
          description: req.param('description'),
          logo: '/'+req.files['logo'].name,
          comment_to_club: [],
          activity: [],
        })
        newClub.save(function(err) {
          if (err) console.log(err);
          else {
            console.log("success!!!");
          }
        })
        var newUser = new User({
          userName: req.param('username'),
          userPassword: hash(req.param('password')),
          realName: 'Manager of '+req.param('name'),
          phoneNumber: req.param('phone'),
          email: req.param('email'),
          identity: newClub._id,
        })
        newUser.save(function(err) {
          if (err) console.log(err);
          else {
            res.send("success!!!");
          }
        });
      }
    });
  });
  return router;
};