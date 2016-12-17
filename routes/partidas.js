var express = require('express');
var router = express.Router();
var comprobacion = require('../bin/comprobaciones');

router.get('/crearPartida',comprobacion.autentificacionRequerida,function(req, res, next) {
		res.render('crearPartida');
});

router.post('/crearPartida',comprobacion.autentificacionRequerida,function(req, res, next) {

	//Validaciones
	if(req.body.nombrePartida.length != 0 && req.body.numJugadores.length != 0){
		if(Number.isInteger(parseInt(req.body.numJugadores)) && (req.body.numJugadores > 2 && req.body.numJugadores < 8)){ //Para que no hagan la trampa de poner decimales.
			var nTurnos = 0;
			var esquemaPartida = require('../models/partida');
			var nuevaPartida = new esquemaPartida({
				creador: req.session.usuario.nick,
				nombre: req.body.nombrePartida,
				jugadores: [req.session.usuario.nick],
				numJugadores: req.body.numJugadores,
				turnosRestantes: nTurnos,
				estado: 'Abierta'
			});
			nuevaPartida.save(function (err) {
					if(err){
						require('../bin/simpleError').muestraError(res,'Error de la BD','/crearPartida',409);
					}
					else{
						require('../bin/simpleError').muestraError(res,'Se ha la partida correctamente','/',200);
					}
			});
		}
		else{
			require('../bin/simpleError').muestraError(res,'Numero de jugadores no valido','/crearPartida',404);
		}
	}
	else{
		require('../bin/simpleError').muestraError(res,'Alguno de los campos esta vacio,reviselo','/crearPartida',404);
	}

});

router.post('/eliminarPartida',comprobacion.autentificacionRequerida, function(req, res, next) {
        var _partida = require('../models/partida');
        _partida.findOneAndRemove({_id:req.body.id,creador:req.session.usuario.nick},function(err,result){
        	if(err){
                require('../bin/simpleError').muestraError(res,'Error interno','/',500)
            }
        	if(result.length == 0){
        		require('../bin/simpleError').muestraError(res,'Operación no permitida,estas intentando borrar una partida que no has creado tu','/',401);
            }

		});
        res.redirect('/');
});

router.get('/unirsePartida',comprobacion.autentificacionRequerida, function(req, res, next) {
	var _partida = require('../models/partida');
	_partida.find({estado:'Abierta'}).where('jugadores').ne(req.session.usuario.nick).exec(function(err,partida){
		if(err){
				res.render('unirsePartida');
		}
		else{
				res.render('unirsePartida',{partidas:partida});
		}
	});
});

router.post('/unirsePartida/:id',comprobacion.autentificacionRequerida, function(req, res, next) {
        var _partida = require('../models/partida');
        _partida.findByIdAndUpdate(req.params.id,{$push:{jugadores:req.session.usuario.nick}},{safe: true, upsert: true},
        function(err, model) {
            console.log(err);
            res.redirect('/');
        });
});

router.get('/partida/:id',comprobacion.autentificacionRequerida,function(req, res, next) {
		require('../models/comentario');
    require('../models/mano');
		var _partida = require('../models/partida');
		var id = req.params.id;

			_partida.findById(id).populate('comentarios').exec(function(err,result) {
				console.log(result);
                res.render('partida',{partida:result});
			});
});

/* Añade un nuevo comentario a los comentarios de la partida*/
router.post('/nuevoComentario/:partida/',comprobacion.autentificacionRequerida, function(req, res, next) {
				var _partida = require('../models/partida');
        var esquemaComentario = require('../models/comentario');
        var nuevoComentario = new esquemaComentario({
        	partida:id = req.params.id,
					usuario:req.session.usuario.id,
					mensaje:req.body.nuevoComentario
		});
        nuevoComentario.save(function(err,result){
            if(err){
                require('../bin/simpleError').muestraError(res,err,'/partida/'+ req.params.partida,409);
            }
            else{
							_partida.findByIdAndUpdate(req.params.partida,{$push:{comentarios:result}},{safe: true, upsert: true},
			        function(err, model) {
			            require('../bin/simpleError').muestraError(res,'Comentario realizado!','/partida/'+ req.params.partida,200);
			        });

            }
		});
});

module.exports = router;
